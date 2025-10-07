import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creator_id, email, source, metadata = {} } = body;

    if (!creator_id || !email || !source) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert email lead
    const { data, error } = await supabase
      .from('email_leads')
      .upsert({
        creator_id,
        email: email.toLowerCase(),
        source,
        metadata,
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'creator_id,email,source',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error collecting email lead:', error);
      return NextResponse.json(
        { error: 'Failed to collect email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in email lead collection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    let query = supabase
      .from('email_leads')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (source) {
      query = query.eq('source', source);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: data });
  } catch (error) {
    console.error('Error in email leads fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
