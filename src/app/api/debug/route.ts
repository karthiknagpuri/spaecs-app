import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test 1: Get all profiles
    const { data: allProfiles, error: allError } = await supabaseAdmin
      .from("creator_pages")
      .select("*");

    // Test 2: Get user's profile without .single()
    const { data: userProfiles, error: userError } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id);

    // Test 3: Get user's profile WITH .single()
    const { data: singleProfile, error: singleError } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user_id: user.id,
      test1_all_profiles: {
        count: allProfiles?.length || 0,
        error: allError,
        profiles: allProfiles
      },
      test2_user_profiles_array: {
        count: userProfiles?.length || 0,
        error: userError,
        profiles: userProfiles
      },
      test3_user_profile_single: {
        found: !!singleProfile,
        error: singleError,
        profile: singleProfile
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
