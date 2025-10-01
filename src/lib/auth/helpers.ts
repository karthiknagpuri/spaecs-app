import { createClient } from '@/lib/supabase/client';

/**
 * Auth helper utilities for Google OAuth authentication
 */

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResult {
  success: boolean;
  error?: AuthError;
}

/**
 * Sign in with Google OAuth
 * @param redirectTo - Optional custom redirect URL after authentication
 * @returns Promise with authentication result
 */
export async function signInWithGoogle(
  redirectTo?: string
): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const callbackUrl = redirectTo || `${baseUrl}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Sign out the current user
 * @returns Promise with sign out result
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Get the current user's session
 * @returns Promise with session data or null
 */
export async function getSession() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Get the current authenticated user
 * @returns Promise with user data or null
 */
export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns Promise with boolean indicating auth status
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Refresh the current session
 * @returns Promise with refresh result
 */
export async function refreshSession(): Promise<AuthResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.name,
        },
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}

/**
 * Subscribe to auth state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Get user metadata (email, name, avatar)
 * @returns Promise with user metadata or null
 */
export async function getUserMetadata() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    return {
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
      provider: user.app_metadata?.provider,
    };
  } catch (error) {
    console.error('Get user metadata error:', error);
    return null;
  }
}

/**
 * Check if session is expired or expiring soon
 * @param thresholdMinutes - Minutes before expiry to consider "expiring soon" (default: 5)
 * @returns Promise with boolean indicating if session needs refresh
 */
export async function shouldRefreshSession(thresholdMinutes: number = 5): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;

    const expiresAt = session.expires_at;
    if (!expiresAt) return false;

    const now = Math.floor(Date.now() / 1000);
    const thresholdSeconds = thresholdMinutes * 60;

    return expiresAt - now < thresholdSeconds;
  } catch (error) {
    console.error('Check session expiry error:', error);
    return true; // Assume needs refresh on error
  }
}
