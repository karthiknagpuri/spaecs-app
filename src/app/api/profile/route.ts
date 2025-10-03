import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  validateUsername,
  validateTextLength,
  sanitizeText,
  TEXT_LIMITS
} from "@/lib/validation";
import {
  createErrorResponse,
  AuthenticationError,
  ValidationError,
  ConflictError
} from "@/lib/errors";
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Use admin client to bypass RLS for user's own profile
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get creator profile
    const { data: profile, error } = await supabaseAdmin
      .from("creator_pages")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // If no profile exists, return null
    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return createErrorResponse(error, 'GET /api/profile');
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new AuthenticationError();
    }

    // Rate limiting - strict for profile creation
    await rateLimit(
      request,
      getRateLimitIdentifier(request, user.id),
      RATE_LIMITS.profileCreate
    );

    const body = await request.json();
    const { username, display_name, bio, social_links, tier_configs } = body;

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new ValidationError(usernameValidation.error!, 'username');
    }

    // Validate display name
    const displayNameValidation = validateTextLength(
      display_name || username,
      'Display name',
      TEXT_LIMITS.DISPLAY_NAME.min,
      TEXT_LIMITS.DISPLAY_NAME.max
    );
    if (!displayNameValidation.valid) {
      throw new ValidationError(displayNameValidation.error!, 'display_name');
    }

    // Validate bio
    if (bio) {
      const bioValidation = validateTextLength(
        bio,
        'Bio',
        TEXT_LIMITS.BIO.min,
        TEXT_LIMITS.BIO.max
      );
      if (!bioValidation.valid) {
        throw new ValidationError(bioValidation.error!, 'bio');
      }
    }

    // Sanitize text inputs
    const sanitizedDisplayName = sanitizeText(display_name || username);
    const sanitizedBio = sanitizeText(bio || '');

    // Check if username (slug) is already taken - use atomic operation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: existingProfile } = await supabaseAdmin
      .from("creator_pages")
      .select("id")
      .eq("slug", username)
      .single();

    if (existingProfile) {
      throw new ConflictError('Username already taken');
    }

    // Ensure user exists in public.users table
    await supabaseAdmin
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        username: username,
        display_name: sanitizedDisplayName,
        is_creator: true
      }, {
        onConflict: 'id'
      });

    // Create profile with sanitized data
    const { data: profile, error } = await supabaseAdmin
      .from("creator_pages")
      .insert({
        user_id: user.id,
        slug: username,
        title: sanitizedDisplayName,
        description: sanitizedBio,
        social_links: social_links || {},
        tier_configs: tier_configs || [
          {
            id: "tier_1",
            name: "Supporter",
            price: 199,
            description: "Show your support and get exclusive updates",
            benefits: ["Early access to content", "Supporter badge", "Monthly newsletter"]
          },
          {
            id: "tier_2",
            name: "Fan",
            price: 499,
            description: "Get closer to the creative process",
            benefits: ["All Supporter benefits", "Behind-the-scenes content", "Monthly Q&A", "Discord access"]
          },
          {
            id: "tier_3",
            name: "VIP",
            price: 999,
            description: "The ultimate fan experience",
            benefits: ["All Fan benefits", "1-on-1 monthly call", "Custom requests", "Physical merchandise"]
          }
        ]
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new ConflictError('Username already taken');
      }
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return createErrorResponse(error, 'POST /api/profile');
  }
}

export async function PUT(request: NextRequest) {
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
      RATE_LIMITS.profileUpdate
    );

    const body = await request.json();
    const { slug, display_name, bio, social_links, tier_configs, avatar_url, cover_image } = body;

    // Validate and sanitize inputs
    let sanitizedData: any = {};

    if (slug !== undefined) {
      const validation = validateUsername(slug);
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'slug');
      }
      sanitizedData.slug = slug;
    }

    if (display_name !== undefined) {
      const validation = validateTextLength(
        display_name,
        'Display name',
        TEXT_LIMITS.DISPLAY_NAME.min,
        TEXT_LIMITS.DISPLAY_NAME.max
      );
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'display_name');
      }
      sanitizedData.title = sanitizeText(display_name);
    }

    if (bio !== undefined) {
      const validation = validateTextLength(
        bio,
        'Bio',
        TEXT_LIMITS.BIO.min,
        TEXT_LIMITS.BIO.max
      );
      if (!validation.valid) {
        throw new ValidationError(validation.error!, 'bio');
      }
      sanitizedData.description = sanitizeText(bio);
    }

    if (social_links !== undefined) {
      sanitizedData.social_links = social_links;
    }

    if (tier_configs !== undefined) {
      // Validate tier configs
      if (!Array.isArray(tier_configs)) {
        throw new ValidationError('Tier configs must be an array', 'tier_configs');
      }
      sanitizedData.tier_configs = tier_configs;
    }

    if (avatar_url !== undefined) {
      sanitizedData.avatar_url = avatar_url;
    }

    if (cover_image !== undefined) {
      sanitizedData.cover_image = cover_image;
    }

    // Use admin client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify ownership before update
    const { data: existingProfile } = await supabaseAdmin
      .from("creator_pages")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (!existingProfile) {
      throw new ValidationError('Profile not found');
    }

    // Update profile
    const { data: profile, error } = await supabaseAdmin
      .from("creator_pages")
      .update(sanitizedData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation for slug
      if (error.code === '23505') {
        throw new ConflictError('Username already taken');
      }
      throw error;
    }

    return NextResponse.json({ profile });
  } catch (error: any) {
    return createErrorResponse(error, 'PUT /api/profile');
  }
}
