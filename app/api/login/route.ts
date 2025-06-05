import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Login API: Iniciando proceso de login')
    
    const body = await request.json()
    console.log('📝 Login API: Datos recibidos:', { email: body.email, hasPassword: !!body.password })
    
    const { email, password } = body
    
    if (!email || !password) {
      console.log('❌ Login API: Email o password faltante')
      return NextResponse.json({ error: 'Email y contraseña son requeridos' }, { status: 400 })
    }
    
    // Crear cliente de Supabase con manejo de cookies
    console.log('🔗 Login API: Creando cliente Supabase')
    const supabase = createRouteHandlerClient({ cookies })
    
    // Realizar login
    console.log('🔐 Login API: Intentando autenticación con Supabase')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.log('❌ Login API: Error de Supabase:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (!data.session) {
      console.log('❌ Login API: No se pudo crear la sesión')
      return NextResponse.json({ error: 'No se pudo crear la sesión' }, { status: 400 })
    }
    
    console.log('✅ Login API: Sesión creada para usuario:', data.session.user.id)
      // Verificar si es administrador usando service role
    console.log('👮 Login API: Verificando permisos de administrador')
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('role, full_name')
      .eq('id', data.session.user.id)
      .single()
    
    if (adminError || !adminUser) {
      console.log('❌ Login API: Usuario no es administrador:', adminError?.message)
      await supabase.auth.signOut()
      return NextResponse.json({ 
        error: 'No tienes permisos de administrador' 
      }, { status: 403 })
    }
    
    console.log('✅ Login API: Usuario administrador verificado:', adminUser.role)
    
    // Actualizar último login
    await adminSupabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.session.user.id)    // Crear respuesta con redirect y token
    console.log('🎯 Login API: Creando respuesta exitosa')
    const response = NextResponse.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        role: adminUser.role,
        full_name: adminUser.full_name
      },
      token: data.session.access_token, // Incluir el token de acceso
      redirectTo: '/admin'
    })

    // Set persistent authentication cookies
    response.cookies.set('sb-auth-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    response.cookies.set('user-role', adminUser.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })
    
    console.log('✅ Login API: Login completado exitosamente')
    return response
    
  } catch (error) {
    console.error('💥 Login API: Error inesperado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
