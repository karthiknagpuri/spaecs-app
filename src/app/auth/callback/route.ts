import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * OAuth callback route for Google authentication
 * Handles the redirect from Google OAuth and establishes user session
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const origin = requestUrl.origin;

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);

    // Build error redirect URL with error parameters
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth_error', error);
    if (errorDescription) {
      errorUrl.searchParams.set('auth_error_description', errorDescription);
    }

    return NextResponse.redirect(errorUrl.toString());
  }

  // Validate authorization code is present
  if (!code) {
    console.error('No authorization code provided');
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth_error', 'missing_code');
    errorUrl.searchParams.set('auth_error_description', 'No authorization code received from provider');

    return NextResponse.redirect(errorUrl.toString());
  }

  try {
    const supabase = await createClient();

    // Exchange code for session with error handling
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Session exchange error:', exchangeError);
      const errorUrl = new URL('/', origin);
      errorUrl.searchParams.set('auth_error', 'session_exchange_failed');
      errorUrl.searchParams.set('auth_error_description', exchangeError.message);

      return NextResponse.redirect(errorUrl.toString());
    }

    const { user, session } = data;

    if (!user || !session) {
      console.error('No user or session returned from exchange');
      const errorUrl = new URL('/', origin);
      errorUrl.searchParams.set('auth_error', 'invalid_session');
      errorUrl.searchParams.set('auth_error_description', 'Failed to establish user session');

      return NextResponse.redirect(errorUrl.toString());
    }

    // Successfully authenticated, now check user profile
    try {
      const { data: profile, error: profileError } = await supabase
        .from('creator_pages')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() to avoid error on no rows

      if (profileError) {
        console.error('Profile lookup error:', profileError);
        // Don't fail auth, just send to onboarding
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      if (profile && profile.slug) {
        // Existing user with profile, redirect to dashboard
        return NextResponse.redirect(`${origin}/dashboard`);
      } else {
        // New user or user without profile, redirect to onboarding
        return NextResponse.redirect(`${origin}/onboarding`);
      }
    } catch (profileError) {
      // Profile check failed, but auth succeeded - send to onboarding
      console.error('Profile check exception:', profileError);
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  } catch (error) {
    // Unexpected error during authentication process
    console.error('Unexpected auth callback error:', error);
    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('auth_error', 'unexpected_error');
    errorUrl.searchParams.set(
      'auth_error_description',
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );

    return NextResponse.redirect(errorUrl.toString());
  }
}
