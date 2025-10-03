import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// POST - Track link click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use admin client to increment clicks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Call the increment function
    const { data, error } = await supabaseAdmin.rpc('increment_link_clicks', {
      link_id: id
    });

    if (error) {
      console.error('[POST /api/custom-links/[id]/click] Error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[POST /api/custom-links/[id]/click] Exception:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
