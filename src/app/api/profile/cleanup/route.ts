import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get all profiles grouped by user_id
    const { data: allProfiles, error: fetchError } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Group profiles by user_id
    const profilesByUser = new Map<string, any[]>();
    allProfiles?.forEach(profile => {
      if (!profilesByUser.has(profile.user_id)) {
        profilesByUser.set(profile.user_id, []);
      }
      profilesByUser.get(profile.user_id)!.push(profile);
    });

    // Find duplicates and delete older ones
    const duplicates = [];
    const deleted = [];

    for (const [user_id, profiles] of profilesByUser.entries()) {
      if (profiles.length > 1) {
        duplicates.push({ user_id, count: profiles.length });

        // Keep the newest (first in array due to ordering), delete the rest
        const toDelete = profiles.slice(1);

        for (const profile of toDelete) {
          const { error: deleteError } = await supabaseAdmin
            .from("creator_pages")
            .delete()
            .eq("id", profile.id);

          if (!deleteError) {
            deleted.push(profile.id);
          }
        }
      }
    }

    return NextResponse.json({
      message: "Cleanup complete",
      duplicates,
      deleted,
      totalDeleted: deleted.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
