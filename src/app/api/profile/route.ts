import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get creator profile
    const { data: profile, error } = await supabase
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // If no profile exists, return null (user needs to create one)
    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
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
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, display_name, bio, social_links, support_tiers } = body;

    // Validate username format (alphanumeric, underscore, dash)
    if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: "Invalid username format. Use only letters, numbers, underscore, and dash." },
        { status: 400 }
      );
    }

    // Check if username (slug) is already taken
    const { data: existingProfile } = await supabase
      .from("creator_pages")
      .select("id")
      .eq("slug", username)
      .single();

    if (existingProfile) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from("creator_pages")
      .insert({
        user_id: user.id,
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
        ]
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { display_name, bio, social_links, support_tiers, avatar_url, cover_image } = body;

    // Update profile
    const { data: profile, error } = await supabase
      .from("creator_pages")
      .update({
        title: display_name,
        description: bio,
        social_links,
        tier_configs: support_tiers,
        avatar_url,
        cover_image
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}