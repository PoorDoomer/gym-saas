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
    data: { user },
  } = await supabase.auth.getUser()

  console.log('Middleware - User after getUser:', user ? user.email : 'No user after getUser');
  console.log('Middleware - Supabase response cookies after setAll:', supabaseResponse.cookies.getAll());

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/members', '/classes', '/trainers', '/settings', '/profile', '/checkins', '/payments', '/reports', '/subscription-plans', '/trainer-dashboard', '/member-dashboard', '/gym-management', '/gym-setup', '/gym-selection']
  const authRoutes = ['/login', '/signup']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  const isMainPage = request.nextUrl.pathname === '/'

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    console.log('Middleware - Redirecting to login: Protected route and no user');
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For authenticated users, get their role and redirect accordingly
  if (user && (isAuthRoute || isMainPage)) {
    try {
      console.log('🔍 Middleware - Starting role check for user:', user.email, 'User ID:', user.id)
      
      // Get user roles from database with retry logic
      let userRoles = null
      let error = null
      
      // Try up to 2 times for better reliability
      for (let attempt = 1; attempt <= 2; attempt++) {
        const result = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
        
        userRoles = result.data
        error = result.error
        
        if (!error && userRoles) {
          console.log(`🔍 Middleware - Role query successful on attempt ${attempt}:`, userRoles)
          break
        }
        
        console.log(`⚠️ Middleware - Role query attempt ${attempt} failed:`, error?.message)
        
        // Small delay before retry
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      console.log('🔍 Middleware - Final role query result:', { userRoles, error: error?.message })

      if (error) {
        console.error('❌ Middleware - Error fetching user roles after retries:', error)
      }

      let redirectPath = '/gym-management' // Default for admin/gym owners

      if (userRoles && userRoles.length > 0) {
        const roles = userRoles.map(r => r.role)
        console.log('🔍 Middleware - Detected roles:', roles)
        
        // Prioritize roles: admin > trainer > member
        if (roles.includes('admin')) {
          redirectPath = '/gym-management'
          console.log('🎯 Middleware - Admin role detected, redirecting to gym-management')
        } else if (roles.includes('trainer')) {
          redirectPath = '/trainer-dashboard'
          console.log('🎯 Middleware - Trainer role detected, redirecting to trainer-dashboard')
        } else if (roles.includes('member')) {
          redirectPath = '/member-dashboard'
          console.log('🎯 Middleware - Member role detected, redirecting to member-dashboard')
        }
      } else {
        console.log('⚠️ Middleware - No roles found, using default gym-management')
        // For users with no roles, check if they might be gym owners
        redirectPath = '/gym-management'
      }

      console.log(`✅ Middleware - Final redirect decision: ${user.email} → ${redirectPath}`)
      return NextResponse.redirect(new URL(redirectPath, request.url))
      
    } catch (error) {
      console.error('💥 Middleware - Error in role-based redirection:', error)
      // Fallback to gym-management on error
      return NextResponse.redirect(new URL('/gym-management', request.url))
    }
  }

  console.log('Middleware - Returning supabase response');
  return supabaseResponse
} 