import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logError, logSecurity } from '@/lib/logger'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Validate environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    logError('Missing Supabase environment variables');
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Redirect logged-in users from home to dashboard
    if (user && request.nextUrl.pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protect dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  } catch (error) {
    // SECURITY: Proper error handling with logging and safe defaults
    logError('Middleware auth error', error, {
      path: request.nextUrl.pathname,
    });

    // For critical auth errors on protected routes, redirect to home
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      logSecurity('Auth error on protected route, redirecting to home', {
        path: request.nextUrl.pathname,
      });
      return NextResponse.redirect(new URL('/', request.url));
    }

    // For other routes, continue but user will be treated as unauthenticated
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}