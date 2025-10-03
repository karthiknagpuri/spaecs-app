import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/posts/[id]/view - Track post view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: post_id } = params;

    const body = await request.json();
    const { read_percentage, time_spent_seconds } = body;

    // Use the track_post_view function
    const { error } = await supabase.rpc('track_post_view', {
      p_post_id: post_id,
      p_read_percentage: read_percentage || null,
      p_time_spent_seconds: time_spent_seconds || null
    });

    if (error) {
      console.error('Error tracking view:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/posts/[id]/view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
