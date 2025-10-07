import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tier_id = searchParams.get('tier_id');
    const benefit_type = searchParams.get('benefit_type');
    const is_enabled = searchParams.get('is_enabled');

    let query = supabase
      .from('member_benefits')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (tier_id && tier_id !== 'all') {
      query = query.eq('tier_id', tier_id);
    }

    if (benefit_type) {
      query = query.eq('benefit_type', benefit_type);
    }

    if (is_enabled !== null && is_enabled !== undefined) {
      query = query.eq('is_enabled', is_enabled === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching benefits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch benefits' },
        { status: 500 }
      );
    }

    return NextResponse.json({ benefits: data });
  } catch (error) {
    console.error('Error in benefits fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      tier_id,
      benefit_type,
      name,
      description,
      is_enabled = true,
      config = {}
    } = body;

    if (!tier_id || !benefit_type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('member_benefits')
      .insert({
        creator_id: user.id,
        tier_id,
        benefit_type,
        name,
        description,
        is_enabled,
        config
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating benefit:', error);
      return NextResponse.json(
        { error: 'Failed to create benefit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, benefit: data });
  } catch (error) {
    console.error('Error in benefit creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
