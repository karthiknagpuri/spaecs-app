import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createErrorResponse, NotFoundError } from "@/lib/errors";
import { validateUsername } from "@/lib/validation";
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

// Get public profile by username/slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validate username format
    const validation = validateUsername(username);
    if (!validation.valid) {
      throw new NotFoundError('Profile not found');
    }

    // Rate limiting for public reads
    await rateLimit(
      request,
      getRateLimitIdentifier(request),
      RATE_LIMITS.publicRead
    );

    // Use admin client to bypass RLS for public profile reads
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch profile by slug (public endpoint - uses admin client to bypass RLS)
    const { data: profile, error } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("slug", username)
      .single();

    if (error || !profile) {
      throw new NotFoundError('Profile not found');
    }

    // Get supporter count for the creator
    const { count: supporterCount } = await supabaseAdmin
      .from("supporters")
      .select("*", { count: 'exact', head: true })
      .eq("creator_id", profile.user_id)
      .eq("status", "active");

    // Fetch custom links from new table (only active and visible links)
    // FIX: Use proper parameter binding instead of string interpolation to prevent SQL injection
    const now = new Date().toISOString();

    const { data: customLinks, error: linksError } = await supabaseAdmin
      .from("custom_links")
      .select("id, title, url, icon, description, category, is_featured, button_color, show_click_count, click_count, display_order")
      .eq("creator_id", profile.user_id)
      .eq("is_active", true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`expire_date.is.null,expire_date.gt.${now}`)
      .order("is_pinned", { ascending: false })
      .order("display_order", { ascending: true });

    if (linksError) {
      console.error('[GET /api/profile/[username]] Error fetching custom links:', linksError);
    }

    // Add supporter count and custom links to profile
    const profileWithStats = {
      ...profile,
      total_supporters: supporterCount || 0,
      custom_links: customLinks || []
    };

    return NextResponse.json({ profile: profileWithStats });
  } catch (error: any) {
    return createErrorResponse(error, 'GET /api/profile/[username]');
  }
}
