import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Autenticar con Supabase
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, full_name')
      .eq('id', data.user.id)
      .single()

    if (adminError || !adminUser) {
      // Cerrar sesión si no es administrador
      await supabase.auth.signOut()
      return NextResponse.json({ error: 'No tienes permisos de administrador' }, { status: 403 })
    }    // Actualizar último login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)// Incluir token con información clara sobre la expiración
    const expiresAt = new Date(data.session?.expires_at || 0).getTime();
    const tokenExpirationInfo = {
      expiresAt,
      expiresIn: expiresAt ? Math.floor((expiresAt - Date.now()) / 1000) : 0
    };

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: adminUser.full_name,
        role: adminUser.role
      },
      session: data.session,
      token: data.session?.access_token,
      tokenInfo: tokenExpirationInfo
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    
    // Validación básica del formato JWT (debe tener 3 partes separadas por punto)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return NextResponse.json({ error: 'Formato de token inválido' }, { status: 401 })
    }
      // Intentar decodificar el payload (sin verificación, solo para verificar expiración)
    try {      if (!tokenParts[1]) {
        return NextResponse.json({ error: 'Token incompleto' }, { status: 401 })
      }
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      // Verificar expiración
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: 'Token expirado' }, { status: 401 })
      }
    } catch (e) {
      return NextResponse.json({ error: 'Payload de token inválido' }, { status: 401 })
    }
      // Verificar el token y obtener el usuario
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Cerrar sesión
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      return NextResponse.json({ error: signOutError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sesión cerrada exitosamente' })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
