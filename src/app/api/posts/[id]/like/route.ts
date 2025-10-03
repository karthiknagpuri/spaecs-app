import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/posts/[id]/like - Toggle like on a post
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

    // Use the toggle_post_like function
    const { data, error } = await supabase.rpc('toggle_post_like', {
      p_post_id: post_id
    });

    if (error) {
      console.error('Error toggling like:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // data will be true if liked, false if unliked
    return NextResponse.json({
      liked: data,
      message: data ? 'Post liked' : 'Post unliked'
    });
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/like:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
