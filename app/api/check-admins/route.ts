import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin not initialized' }, { status: 500 })
    }

    // Verificar usuarios de auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    // Verificar admin_users
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
    
    return NextResponse.json({
      authUsers: authUsers?.users?.length || 0,
      adminUsers: adminUsers?.length || 0,
      authUsersList: authUsers?.users?.map(u => ({ id: u.id, email: u.email })) || [],
      adminUsersList: adminUsers || [],
      errors: {
        auth: authError?.message,
        admin: adminError?.message
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
