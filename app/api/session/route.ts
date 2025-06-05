import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Session API: Verificando sesión existente')
    
    // Crear cliente de Supabase con manejo de cookies
    const supabase = createRouteHandlerClient({ cookies })
    
    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ Session API: No hay usuario autenticado')
      return NextResponse.json({ 
        authenticated: false,
        error: 'No authenticated user' 
      }, { status: 401 })
    }
    
    console.log('👤 Session API: Usuario encontrado:', user.id)
    
    // Verificar si es administrador
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('role, full_name')
      .eq('id', user.id)
      .single()
    
    if (adminError || !adminUser) {
      console.log('❌ Session API: Usuario no es administrador')
      return NextResponse.json({ 
        authenticated: false,
        error: 'No admin permissions' 
      }, { status: 403 })
    }

    console.log('✅ Session API: Sesión válida para administrador:', adminUser.role)
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: adminUser.role,
        full_name: adminUser.full_name
      }
    })
    
  } catch (error) {
    console.error('💥 Session API: Error inesperado:', error)
    return NextResponse.json({ 
      authenticated: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Session API: Refrescando sesión')
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error || !data.session) {
      console.log('❌ Session API: Error al refrescar sesión:', error?.message)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to refresh session' 
      }, { status: 401 })
    }
    
    console.log('✅ Session API: Sesión refrescada exitosamente')
    
    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed successfully'
    })

    // Update authentication cookies with new tokens
    response.cookies.set('sb-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('💥 Session API: Error inesperado:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
