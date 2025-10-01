import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = await createClient();
    const username = params.username.replace("@", "");

    // Get creator profile
    const { data: profile, error } = await supabase
      .from("creator_profiles")
      .select(`
        *,
        supporters:supporters(count)
      `)
      .eq("username", username)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Get recent supporters count
    const { count: supportersCount } = await supabase
      .from("supporters")
      .select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id)
      .eq("status", "active");

    // Get total earnings for public display (rounded)
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("creator_id", username)
      .eq("status", "completed");

    const totalEarnings = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    return NextResponse.json({
      ...profile,
      supporters_count: supportersCount || 0,
      total_earnings_display: Math.round(totalEarnings / 1000) * 1000, // Round to nearest 1000
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const username = params.username.replace("@", "");
    const body = await request.json();

    // Verify user owns this profile
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("user_id")
      .eq("username", username)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from("creator_profiles")
      .update(body)
      .eq("username", username)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}