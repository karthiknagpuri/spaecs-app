import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route uses the service role key to bypass RLS
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { user_id, username, display_name, bio, social_links, support_tiers, custom_links } = body;

    console.log('[Admin] user_id:', user_id, 'username:', username);

    // Check if profile already exists for this user_id
    const { data: existingProfileByUser, error: userCheckError } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("user_id", user_id)
      .single();

    console.log('[Admin] Profile by user_id found:', !!existingProfileByUser);
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('[Admin] Error checking user:', userCheckError);
    }

    if (existingProfileByUser) {
      // Profile already exists for this user - return it
      console.log('[Admin] Returning existing profile for user');
      return NextResponse.json({ profile: existingProfileByUser });
    }

    // Check if username/slug is taken
    const { data: existingProfileBySlug, error: slugCheckError } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("slug", username)
      .single();

    console.log('[Admin] Profile by slug found:', !!existingProfileBySlug);
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('[Admin] Error checking slug:', slugCheckError);
    }

    if (existingProfileBySlug) {
      // Profile exists with this slug - update the user_id to fix orphaned profile
      console.log('[Admin] Fixing orphaned profile - old user_id:', existingProfileBySlug.user_id, 'new user_id:', user_id);
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from("creator_pages")
        .update({ user_id: user_id })
        .eq("slug", username)
        .select()
        .single();

      if (updateError) {
        console.error('[Admin] Error fixing profile:', updateError);
        return NextResponse.json(
          { error: "Failed to fix orphaned profile: " + updateError.message },
          { status: 500 }
        );
      }

      console.log('[Admin] Successfully updated profile. New user_id:', updatedProfile?.user_id);
      return NextResponse.json({ profile: updatedProfile });
    }

    console.log('[Admin] No existing profile found, creating new one');

    // Create profile using service role (bypasses RLS)
    const { data: profile, error } = await supabaseAdmin
      .from("creator_pages")
      .insert({
        user_id,
        slug: username,
        title: display_name || username,
        description: bio || '',
        social_links: social_links || {},
        tier_configs: support_tiers || [
          {
            id: "tier_1",
            name: "Supporter",
            price: 199,
            description: "Show your support and get exclusive updates",
            benefits: ["Early access to content", "Supporter badge", "Monthly newsletter"]
          },
          {
            id: "tier_2",
            name: "Fan",
            price: 499,
            description: "Get closer to the creative process",
            benefits: ["All Supporter benefits", "Behind-the-scenes content", "Monthly Q&A", "Discord access"]
          },
          {
            id: "tier_3",
            name: "VIP",
            price: 999,
            description: "The ultimate fan experience",
            benefits: ["All Fan benefits", "1-on-1 monthly call", "Custom requests", "Physical merchandise"]
          }
        ],
        custom_links: custom_links || []
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}