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
    const { newUsername } = body;

    // Validate username format
    if (!newUsername || !/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      return NextResponse.json(
        { error: "Invalid username format. Use only letters, numbers, underscore, and dash." },
        { status: 400 }
      );
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      return NextResponse.json(
        { error: "Username must be between 3 and 20 characters" },
        { status: 400 }
      );
    }

    // Check if user has a profile
    const { data: currentProfile, error: fetchError } = await supabase
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !currentProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from("creator_pages")
      .select("id")
      .eq("slug", newUsername.toLowerCase())
      .neq("user_id", user.id)
      .single();

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      );
    }

    // Check username change history (cooldown period)
    const { data: changeHistory } = await supabase
      .from("username_changes")
      .select("changed_at")
      .eq("user_id", user.id)
      .order("changed_at", { ascending: false })
      .limit(1)
      .single();

    if (changeHistory) {
      const lastChange = new Date(changeHistory.changed_at);
      const now = new Date();
      const daysSinceLastChange = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastChange < 30) {
        const daysRemaining = Math.ceil(30 - daysSinceLastChange);
        return NextResponse.json(
          {
            error: `You can only change your username once every 30 days. Please wait ${daysRemaining} more day${daysRemaining === 1 ? '' : 's'}.`
          },
          { status: 429 }
        );
      }
    }

    // Update username
    const { data: updatedProfile, error: updateError } = await supabase
      .from("creator_pages")
      .update({
        slug: newUsername.toLowerCase(),
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

    // Record username change
    await supabase
      .from("username_changes")
      .insert({
        user_id: user.id,
        old_username: currentProfile.slug,
        new_username: newUsername.toLowerCase(),
        changed_at: new Date().toISOString()
      });

    return NextResponse.json({
      profile: updatedProfile,
      message: "Username updated successfully",
      newUrl: `/@${newUsername.toLowerCase()}`
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}