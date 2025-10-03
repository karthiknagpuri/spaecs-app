import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  validateEmail,
  validateTextLength,
  sanitizeText,
  TEXT_LIMITS
} from "@/lib/validation";
import {
  createErrorResponse,
  ValidationError
} from "@/lib/errors";
import { rateLimit, getRateLimitIdentifier, RATE_LIMITS } from "@/lib/rate-limit";

// POST - Submit collaboration request
export async function POST(request: NextRequest) {
  try {
    // Rate limiting - use IP for public submissions
    await rateLimit(
      request,
      getRateLimitIdentifier(request),
      { requests: 5, window: 3600 } // 5 requests per hour
    );

    const body = await request.json();
    const {
      creator_id,
      name,
      email,
      phone,
      company_name,
      message,
      budget_min,
      budget_max,
      collab_type
    } = body;

    // Validate required fields
    if (!creator_id || !name || !email || !message) {
      throw new ValidationError('Name, email, and message are required');
    }

    // Validate name
    const nameValidation = validateTextLength(
      name,
      'Name',
      2,
      100
    );
    if (!nameValidation.valid) {
      throw new ValidationError(nameValidation.error!, 'name');
    }

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      throw new ValidationError(emailValidation.error!, 'email');
    }

    // Validate message
    const messageValidation = validateTextLength(
      message,
      'Message',
      10,
      2000
    );
    if (!messageValidation.valid) {
      throw new ValidationError(messageValidation.error!, 'message');
    }

    // Validate company name if provided
    if (company_name) {
      const companyValidation = validateTextLength(
        company_name,
        'Company name',
        2,
        200
      );
      if (!companyValidation.valid) {
        throw new ValidationError(companyValidation.error!, 'company_name');
      }
    }

    // Validate budget range
    if (budget_min && budget_max && parseInt(budget_min) > parseInt(budget_max)) {
      throw new ValidationError('Minimum budget cannot exceed maximum budget', 'budget');
    }

    // Validate collaboration type
    const validCollabTypes = ['sponsorship', 'partnership', 'content', 'event', 'other'];
    if (collab_type && !validCollabTypes.includes(collab_type)) {
      throw new ValidationError('Invalid collaboration type', 'collab_type');
    }

    // Sanitize text inputs
    const sanitizedName = sanitizeText(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedPhone = phone ? phone.trim() : null;
    const sanitizedCompanyName = company_name ? sanitizeText(company_name) : null;
    const sanitizedMessage = sanitizeText(message);

    // Use admin client to insert
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get referrer and user agent
    const referrer_url = request.headers.get('referer') || null;
    const user_agent = request.headers.get('user-agent') || null;

    const { data: collaborationRequest, error } = await supabaseAdmin
      .from("collaboration_requests")
      .insert({
        creator_id,
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        company_name: sanitizedCompanyName,
        message: sanitizedMessage,
        budget_min: budget_min ? parseInt(budget_min) : null,
        budget_max: budget_max ? parseInt(budget_max) : null,
        collab_type: collab_type || 'other',
        referrer_url,
        user_agent
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      request: collaborationRequest
    });
  } catch (error: any) {
    return createErrorResponse(error, 'POST /api/collaboration-requests');
  }
}

// GET - Fetch collaboration requests (for creators only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Use admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let query = supabaseAdmin
      .from("collaboration_requests")
      .select("*", { count: 'exact' })
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      requests: requests || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error: any) {
    return createErrorResponse(error, 'GET /api/collaboration-requests');
  }
}
