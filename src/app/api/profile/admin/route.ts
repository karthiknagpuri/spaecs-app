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
    const { user_id, username, display_name, bio, social_links, support_tiers } = body;

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
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
        ]
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