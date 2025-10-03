import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Create service role client to bypass RLS for username checking
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Check if username (slug) is already taken using service role to bypass RLS
    const { data: existingProfile } = await supabaseAdmin
      .from("creator_pages")
      .select("id, user_id")
      .eq("slug", username.toLowerCase())
      .maybeSingle();

    // For claiming modal: Username is available only if no one has it
    // (We're not checking for updates, just new claims)
    const available = !existingProfile;

    return NextResponse.json({
      available,
      username: username.toLowerCase()
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}