import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  validateURL,
  validateTextLength,
  sanitizeText,
  validateHexColor,
  validateISODate,
  TEXT_LIMITS
} from "@/lib/validation";
import {
  createErrorResponse,
  AuthenticationError,
  ValidationError
} from "@/lib/errors";
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { detectSocialPlatform } from "@/lib/social-links";

// GET - Fetch user's custom links with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Use admin client to fetch links
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get total count
    const { count } = await supabaseAdmin
      .from("custom_links")
      .select("*", { count: 'exact', head: true })
      .eq("creator_id", user.id);

    // Fetch links with pagination
    const { data: links, error } = await supabaseAdmin
      .from("custom_links")
      .select("*")
      .eq("creator_id", user.id)
      .order("is_pinned", { ascending: false })
      .order("display_order", { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      links: links || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    return createErrorResponse(error, 'GET /api/custom-links');
  }
}

// POST - Create new custom link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Rate limiting
    await rateLimit(
      request,
      getRateLimitIdentifier(request, user.id),
      RATE_LIMITS.linksCreate
    );

    const body = await request.json();
    const {
      title,
      url,
      description,
      icon,
      category,
      tags,
      display_order,
      start_date,
      expire_date,
      is_active,
      is_featured,
      button_color,
      open_in_new_tab,
      is_pinned,
      show_click_count,
      thumbnail_url
    } = body;

    // Validate required fields
    if (!title || !url) {
      throw new ValidationError('Title and URL are required');
    }

    // Validate title
    const titleValidation = validateTextLength(
      title,
      'Title',
      TEXT_LIMITS.LINK_TITLE.min,
      TEXT_LIMITS.LINK_TITLE.max
    );
    if (!titleValidation.valid) {
      throw new ValidationError(titleValidation.error!, 'title');
    }

    // Validate URL - CRITICAL SECURITY FIX
    const urlValidation = validateURL(url);
    if (!urlValidation.valid) {
      throw new ValidationError(urlValidation.error!, 'url');
    }

    // Validate description
    if (description) {
      const descValidation = validateTextLength(
        description,
        'Description',
        TEXT_LIMITS.LINK_DESCRIPTION.min,
        TEXT_LIMITS.LINK_DESCRIPTION.max
      );
      if (!descValidation.valid) {
        throw new ValidationError(descValidation.error!, 'description');
      }
    }

    // Validate button color
    if (button_color) {
      const colorValidation = validateHexColor(button_color);
      if (!colorValidation.valid) {
        throw new ValidationError(colorValidation.error!, 'button_color');
      }
    }

    // Validate dates
    if (start_date) {
      const dateValidation = validateISODate(start_date);
      if (!dateValidation.valid) {
        throw new ValidationError(dateValidation.error!, 'start_date');
      }
    }

    if (expire_date) {
      const dateValidation = validateISODate(expire_date);
      if (!dateValidation.valid) {
        throw new ValidationError(dateValidation.error!, 'expire_date');
      }

      // Check that expire_date is after start_date
      if (start_date && new Date(expire_date) <= new Date(start_date)) {
        throw new ValidationError('Expiration date must be after start date', 'expire_date');
      }
    }

    // Sanitize text inputs
    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = description ? sanitizeText(description) : null;

    // Validate category
    const allowedCategories = ['social', 'shop', 'content', 'event', 'other'];
    if (category && !allowedCategories.includes(category)) {
      throw new ValidationError('Invalid category', 'category');
    }

    // Validate tags
    if (tags && (!Array.isArray(tags) || tags.length > 10)) {
      throw new ValidationError('Tags must be an array with max 10 items', 'tags');
    }

    // Use admin client to create link
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check for duplicate URL
    const { data: existingLink } = await supabaseAdmin
      .from("custom_links")
      .select("id")
      .eq("creator_id", user.id)
      .eq("url", url)
      .single();

    if (existingLink) {
      throw new ValidationError('A link with this URL already exists', 'url');
    }

    // Auto-detect social platform
    const detectedPlatform = detectSocialPlatform(url);

    const { data: link, error } = await supabaseAdmin
      .from("custom_links")
      .insert({
        creator_id: user.id,
        title: sanitizedTitle,
        url,
        description: sanitizedDescription,
        icon,
        category,
        tags,
        display_order: display_order || 0,
        start_date,
        expire_date,
        is_active: is_active !== undefined ? is_active : true,
        is_featured: is_featured || false,
        button_color,
        open_in_new_tab: open_in_new_tab !== undefined ? open_in_new_tab : true,
        is_pinned: is_pinned || false,
        show_click_count: show_click_count || false,
        thumbnail_url: thumbnail_url || null,
        platform: detectedPlatform
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ link });
  } catch (error: any) {
    return createErrorResponse(error, 'POST /api/custom-links');
  }
}
