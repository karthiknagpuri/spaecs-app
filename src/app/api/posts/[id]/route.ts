import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { UpdatePostInput } from '@/types/posts';

// GET /api/posts/[id] - Get single post with stats
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Fetch post with tier config
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, membership_tiers(*)')
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user has liked this post
    const { data: { user } } = await supabase.auth.getUser();
    let is_liked_by_user = false;

    if (user) {
      const { data: like } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      is_liked_by_user = !!like;
    }

    // Fetch comments (top-level only, replies are nested)
    const { data: comments } = await supabase
      .from('post_comments')
      .select('*, user:auth.users(id, email, user_metadata)')
      .eq('post_id', id)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      post: { ...post, is_liked_by_user },
      comments: comments || []
    });
  } catch (error) {
    console.error('Error in GET /api/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/posts/[id] - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<UpdatePostInput> = await request.json();

    // Check ownership
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost || existingPost.creator_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update post
    const { data: post, error } = await supabase
      .from('posts')
      .update({
        title: body.title,
        content: body.content,
        post_type: body.post_type,
        media_url: body.media_url,
        thumbnail_url: body.thumbnail_url,
        visibility: body.visibility,
        required_tier_id: body.required_tier_id,
        category: body.category,
        tags: body.tags,
        is_featured: body.is_featured,
        is_pinned: body.is_pinned,
        scheduled_for: body.scheduled_for,
        is_published: body.is_published
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error in PATCH /api/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const { data: existingPost } = await supabase
      .from('posts')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!existingPost || existingPost.creator_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
