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
  AuthorizationError,
  ValidationError,
  NotFoundError
} from "@/lib/errors";
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";
import { detectSocialPlatform } from "@/lib/social-links";

// PUT - Update custom link
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      RATE_LIMITS.linksUpdate
    );

    const { id } = await params;
    const body = await request.json();

    // Use admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify ownership
    const { data: existingLink } = await supabaseAdmin
      .from("custom_links")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingLink) {
      throw new NotFoundError('Link not found');
    }

    if (existingLink.creator_id !== user.id) {
      throw new AuthorizationError('You do not have permission to update this link');
    }

    // Validate and sanitize fields
    let updateData: any = {};

    if (body.title !== undefined) {
      const validation = validateTextLength(
        body.title,
        'Title',
        TEXT_LIMITS.LINK_TITLE.min,
        TEXT_LIMITS.LINK_TITLE.max
      );
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'title');
      }
      updateData.title = sanitizeText(body.title);
    }

    if (body.url !== undefined) {
      const validation = validateURL(body.url);
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'url');
      }
      updateData.url = body.url;

      // Auto-detect platform when URL changes
      const detectedPlatform = detectSocialPlatform(body.url);
      updateData.platform = detectedPlatform;
    }

    if (body.description !== undefined) {
      if (body.description) {
        const validation = validateTextLength(
          body.description,
          'Description',
          TEXT_LIMITS.LINK_DESCRIPTION.min,
          TEXT_LIMITS.LINK_DESCRIPTION.max
        );
        if (!validation.valid) {
          throw new ValidationError(validation.error!, 'description');
        }
        updateData.description = sanitizeText(body.description);
      } else {
        updateData.description = null;
      }
    }

    if (body.button_color !== undefined) {
      if (body.button_color) {
        const validation = validateHexColor(body.button_color);
        if (!validation.valid) {
          throw new ValidationError(validation.error!, 'button_color');
        }
      }
      updateData.button_color = body.button_color;
    }

    if (body.start_date !== undefined) {
      const validation = validateISODate(body.start_date);
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'start_date');
      }
      updateData.start_date = body.start_date;
    }

    if (body.expire_date !== undefined) {
      const validation = validateISODate(body.expire_date);
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'expire_date');
      }

      // Check that expire_date is after start_date
      if (body.start_date && body.expire_date && new Date(body.expire_date) <= new Date(body.start_date)) {
        throw new ValidationError('Expiration date must be after start date', 'expire_date');
      }

      updateData.expire_date = body.expire_date;
    }

    // Validate category
    if (body.category !== undefined) {
      const allowedCategories = ['social', 'shop', 'content', 'event', 'other'];
      if (body.category && !allowedCategories.includes(body.category)) {
        throw new ValidationError('Invalid category', 'category');
      }
      updateData.category = body.category;
    }

    // Validate tags
    if (body.tags !== undefined) {
      if (body.tags && (!Array.isArray(body.tags) || body.tags.length > 10)) {
        throw new ValidationError('Tags must be an array with max 10 items', 'tags');
      }
      updateData.tags = body.tags;
    }

    // Boolean fields - safe to pass through
    const booleanFields = ['is_active', 'is_featured', 'is_pinned', 'show_click_count', 'open_in_new_tab'];
    for (const field of booleanFields) {
      if (body[field] !== undefined) {
        updateData[field] = Boolean(body[field]);
      }
    }

    // Icon and display_order
    if (body.icon !== undefined) {
      updateData.icon = body.icon;
    }

    if (body.display_order !== undefined) {
      updateData.display_order = parseInt(body.display_order);
    }

    // Thumbnail URL
    if (body.thumbnail_url !== undefined) {
      updateData.thumbnail_url = body.thumbnail_url || null;
    }

    const { data: link, error } = await supabaseAdmin
      .from("custom_links")
      .update(updateData)
      .eq("id", id)
      .eq("creator_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ link });
  } catch (error: any) {
    return createErrorResponse(error, 'PUT /api/custom-links/[id]');
  }
}

// DELETE - Delete custom link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      RATE_LIMITS.linksDelete
    );

    const { id } = await params;

    // Use admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify ownership before delete
    const { data: existingLink } = await supabaseAdmin
      .from("custom_links")
      .select("creator_id")
      .eq("id", id)
      .single();

    if (!existingLink) {
      throw new NotFoundError('Link not found');
    }

    if (existingLink.creator_id !== user.id) {
      throw new AuthorizationError('You do not have permission to delete this link');
    }

    const { error } = await supabaseAdmin
      .from("custom_links")
      .delete()
      .eq("id", id)
      .eq("creator_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return createErrorResponse(error, 'DELETE /api/custom-links/[id]');
  }
}
