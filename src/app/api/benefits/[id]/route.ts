import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const benefitId = params.id;
    const body = await request.json();

    // Verify ownership
    const { data: benefit } = await supabase
      .from('member_benefits')
      .select('creator_id')
      .eq('id', benefitId)
      .single();

    if (!benefit || benefit.creator_id !== user.id) {
      return NextResponse.json(
        { error: 'Benefit not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('member_benefits')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', benefitId)
      .eq('creator_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating benefit:', error);
      return NextResponse.json(
        { error: 'Failed to update benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, benefit: data });
  } catch (error) {
    console.error('Error in benefit update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const benefitId = params.id;

    const { error } = await supabase
      .from('member_benefits')
      .delete()
      .eq('id', benefitId)
      .eq('creator_id', user.id);

    if (error) {
      console.error('Error deleting benefit:', error);
      return NextResponse.json(
        { error: 'Failed to delete benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in benefit deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
