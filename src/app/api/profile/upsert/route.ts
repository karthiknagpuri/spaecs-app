import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const {
      updates,
      create_if_missing = false,
      username
    } = body;

    // First check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    let profile;

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from("creator_pages")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      profile = updatedProfile;
    } else if (create_if_missing && username) {
      // Create new profile if it doesn't exist

      // Check if username is available
      const { data: usernameCheck } = await supabase
        .from("creator_pages")
        .select("id")
        .eq("slug", username)
        .single();

      if (usernameCheck) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }

      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from("creator_pages")
        .insert({
          user_id: user.id,
          slug: username,
          title: updates.title || username,
          description: updates.description || '',
          social_links: updates.social_links || {},
          tier_configs: updates.tier_configs || [
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
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      profile = newProfile;
    } else {
      return NextResponse.json(
        { error: "Profile not found and create_if_missing is false" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      action: existingProfile ? 'updated' : 'created'
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint for partial updates
export async function PATCH(request: NextRequest) {
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
    const { field, value, profile_id } = body;

    // Validate field is allowed to be updated
    const allowedFields = [
      'title', 'description', 'avatar_url', 'cover_image',
      'social_links', 'tier_configs', 'custom_links', 'theme_config',
      'followers_count', 'monthly_earnings'
    ];

    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { error: "Field not allowed for update" },
        { status: 400 }
      );
    }

    // Update single field
    const updateData: any = {
      [field]: value,
      updated_at: new Date().toISOString()
    };

    const query = profile_id
      ? supabase.from("creator_pages").update(updateData).eq("id", profile_id)
      : supabase.from("creator_pages").update(updateData).eq("user_id", user.id);

    const { data: profile, error } = await query
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      updated_field: field
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}