import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, email, name, access_level = 'free' } = body;

    if (!creatorId || !email) {
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

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Check creator's community settings
    const { data: creatorProfile } = await supabase
      .from('creator_pages')
      .select('community_enabled, community_access_level')
      .eq('creator_id', creatorId)
      .single();

    if (!creatorProfile?.community_enabled) {
      return NextResponse.json(
        { error: 'Community is not enabled' },
        { status: 403 }
      );
    }

    // Validate access level permissions
    const allowedLevels = creatorProfile.community_access_level;
    if (allowedLevels !== 'all') {
      // Check if user meets the access requirements
      if (allowedLevels === 'members_only' && !user) {
        return NextResponse.json(
          { error: 'You must be a member to join this community' },
          { status: 403 }
        );
      }
      // Additional checks for tier, paid, free can be added here based on membership status
    }

    // Insert or update community member
    const { data, error } = await supabase
      .from('community_members')
      .upsert({
        creator_id: creatorId,
        member_user_id: user?.id || null,
        email: email.toLowerCase(),
        name,
        access_level,
        status: 'active',
        joined_at: new Date().toISOString(),
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'creator_id,email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error joining community:', error);
      return NextResponse.json(
        { error: 'Failed to join community' },
        { status: 500 }
      );
    }

    // Also add to email leads
    await supabase
      .from('email_leads')
      .upsert({
        creator_id: creatorId,
        email: email.toLowerCase(),
        source: 'community',
        metadata: { name, access_level },
        status: 'active',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'creator_id,email,source',
        ignoreDuplicates: true
      });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in community join:', error);
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
    const status = searchParams.get('status') || 'active';
    const access_level = searchParams.get('access_level');

    let query = supabase
      .from('community_members')
      .select('*')
      .eq('creator_id', user.id)
      .eq('status', status)
      .order('joined_at', { ascending: false });

    if (access_level) {
      query = query.eq('access_level', access_level);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching community members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch community members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ members: data });
  } catch (error) {
    console.error('Error in community members fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
