import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({
        available: false,
        error: "Invalid format. Use only letters, numbers, underscore, and dash."
      });
    }

    // Check minimum length
    if (username.length < 3) {
      return NextResponse.json({
        available: false,
        error: "Username must be at least 3 characters long"
      });
    }

    // Check maximum length
    if (username.length > 20) {
      return NextResponse.json({
        available: false,
        error: "Username must be 20 characters or less"
      });
    }

    // Check if username (slug) is already taken
    const { data: existingProfile } = await supabase
      .from("creator_pages")
      .select("id")
      .eq("slug", username.toLowerCase())
      .single();

    return NextResponse.json({
      available: !existingProfile,
      username: username.toLowerCase()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}