import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren autenticación de administrador
const protectedRoutes = ['/admin']
const adminOnlyRoutes = ['/admin/documents', '/admin/users']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('🛡️ Middleware: Processing request for:', req.nextUrl.pathname)

  // Check if accessing login page while authenticated
  if (req.nextUrl.pathname === '/login') {
    console.log('🔍 Middleware: Checking if user is already authenticated')
    
    const { data: { session } } = await supabase.auth.getSession()
    const userRole = req.cookies.get('user-role')?.value
    
    if (session && userRole) {
      console.log('✅ Middleware: User already authenticated, redirecting to admin')
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  // Si está en una ruta protegida
  if (protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
    console.log('🔒 Middleware: Protected route detected, checking authentication')
    
    // Verificar sesión de usuario
    const { data: { session } } = await supabase.auth.getSession()
    
    // Si no hay sesión, redirigir al login
    if (!session) {
      console.log('❌ Middleware: No session found, redirecting to login')
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check for admin permissions using cookies for quick validation
    const userRole = req.cookies.get('user-role')?.value
      if (!userRole) {
      console.log('⚠️ Middleware: No user role cookie, validating with database')
      
      // Verificar si el usuario es administrador usando service role para evitar problemas de RLS
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: adminData, error: adminServiceError } = await supabaseAdmin
          .from('admin_users')
          .select('role')
          .eq('id', session.user.id)
          .single()
          
        if (adminServiceError || !adminData) {
          console.log('❌ Middleware: User is not an admin, redirecting to unauthorized')
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }

        // Set cookie for future requests to avoid database calls
        const response = NextResponse.next()
        response.cookies.set('user-role', adminData.role, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        })
        
        console.log('✅ Middleware: Admin validation successful, role:', adminData.role)
        return response
        
      } catch (serviceError) {
        console.error('💥 Middleware: Error validating admin status:', serviceError)
        return NextResponse.redirect(new URL('/login', req.url))
      }
    } else {
      console.log('✅ Middleware: User role found in cookie:', userRole)
    }

    // Verificar que tenga un rol válido
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      console.log('❌ Middleware: Invalid user role, redirecting to unauthorized')
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }    // Para rutas que requieren super admin
    if (adminOnlyRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
      if (userRole !== 'super_admin' && userRole !== 'admin') {
        console.log('❌ Middleware: Insufficient permissions for admin-only route')
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
    
    console.log('✅ Middleware: Access granted for protected route')
  }
  
  return res
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login'
  ]
}
