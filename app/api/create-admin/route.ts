import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not initialized' }, { status: 500 })
    }

    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: fullName || 'Administrador'
      },
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ error: `Error creating auth user: ${authError.message}` }, { status: 400 })
    }

    // Crear entrada en admin_users
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: authData.user.id,
        email: email,
        full_name: fullName || 'Administrador',
        role: 'super_admin',
        is_active: true
      })
      .select()
      .single()

    if (adminError) {
      return NextResponse.json({ error: `Error creating admin user: ${adminError.message}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: email,
        full_name: fullName,
        role: 'super_admin'
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
