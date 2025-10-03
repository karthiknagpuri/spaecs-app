import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all profiles for debugging
    const { data: allProfiles, error: allError } = await supabase
      .from("creator_pages")
      .select("id, user_id, slug, title")
      .limit(10);

    // Fetch profile by user_id
    const { data: profileByUser, error: userError } = await supabase
      .from("creator_pages")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    // Fetch profile by slug
    const { data: profileBySlug, error: slugError } = await supabase
      .from("creator_pages")
      .select("*")
      .eq("slug", "nanikarthik98")
      .single();

    return NextResponse.json({
      currentUser: {
        id: user?.id,
        email: user?.email
      },
      allProfiles: allProfiles || [],
      profileByUser: {
        found: !!profileByUser,
        data: profileByUser,
        error: userError
      },
      profileBySlug: {
        found: !!profileBySlug,
        data: profileBySlug,
        error: slugError
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
