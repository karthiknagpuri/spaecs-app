import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { CreateCommentInput } from '@/types/posts';

// GET /api/posts/[id]/comments - Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: post_id } = params;

    // Fetch all comments for the post with user info
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        user:user_id(id, email, user_metadata)
      `)
      .eq('post_id', post_id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Organize comments into tree structure
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create all comment objects
    comments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: organize into tree
    comments?.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error('Error in GET /api/posts/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/posts/[id]/comments - Add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: post_id } = params;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Omit<CreateCommentInput, 'post_id'> = await request.json();

    // Validate content
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id,
        user_id: user.id,
        content: body.content.trim(),
        parent_comment_id: body.parent_comment_id || null
      })
      .select(`
        *,
        user:user_id(id, email, user_metadata)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
