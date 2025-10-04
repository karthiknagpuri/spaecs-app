import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email, name, tags = [] } = body;

    if (!user_id || !email) {
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

    // Insert or update newsletter subscriber
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        user_id,
        email: email.toLowerCase(),
        name,
        tags,
        status: 'subscribed',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error subscribing to newsletter:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Also add to email leads
    await supabase
      .from('email_leads')
      .upsert({
        user_id,
        email: email.toLowerCase(),
        source: 'newsletter',
        metadata: { name, tags },
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,email,source',
        ignoreDuplicates: true
      });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in newsletter subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, email } = body;

    if (!user_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update subscriber status to unsubscribed
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .eq('email', email.toLowerCase());

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in newsletter unsubscribe:', error);
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
    const status = searchParams.get('status') || 'subscribed';

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscribers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscribers: data });
  } catch (error) {
    console.error('Error in subscribers fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
