import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  const user = session?.user

  if (sessionError) {
    console.error('Session error', sessionError)
  }

  if (!session && user) {
    await supabase.auth.signOut()
  }

  if (session && session.expires_at && session.expires_at * 1000 < Date.now()) {
    await supabase.auth.refreshSession()
  }

  console.log('Middleware - User after getUser:', user ? user.email : 'No user after getUser');
  console.log('Middleware - Supabase response cookies after setAll:', supabaseResponse.cookies.getAll());

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/members', '/classes', '/trainers', '/settings', '/profile']
  const authRoutes = ['/login', '/signup']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    console.log('Middleware - Redirecting to login: Protected route and no user');
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    console.log('Middleware - Redirecting to dashboard: Auth route and user');
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  console.log('Middleware - Returning supabase response');
  return supabaseResponse
} 