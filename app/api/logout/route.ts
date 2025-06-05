import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 Logout API: Iniciando proceso de logout')
    
    // Crear cliente de Supabase con manejo de cookies
    const supabase = createRouteHandlerClient({ cookies })
    
    // Realizar logout en Supabase
    console.log('🔐 Logout API: Cerrando sesión en Supabase')
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.log('❌ Logout API: Error de Supabase:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    // Crear respuesta y limpiar cookies
    console.log('🧹 Logout API: Limpiando cookies de autenticación')
    const response = NextResponse.json({
      success: true,
      message: 'Logout exitoso',
      redirectTo: '/login'
    })

    // Clear authentication cookies
    response.cookies.delete('sb-auth-token')
    response.cookies.delete('user-role')
    
    console.log('✅ Logout API: Logout completado exitosamente')
    return response
    
  } catch (error) {
    console.error('💥 Logout API: Error inesperado:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}
