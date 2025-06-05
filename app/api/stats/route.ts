import { NextRequest, NextResponse } from 'next/server'
import { documentService } from '@/lib/document-service-r2'
import { createClient } from '@supabase/supabase-js'
import { handleCors, withCors } from '@/lib/cors'

// Función para verificar autenticación de administrador
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return null

    // Verificar que es administrador
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()

    return adminUser ? user : null
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de administrador para estadísticas detalladas
    const user = await verifyAdminAuth(request)
    if (!user) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request)
    }

    const stats = await documentService.getGeneralStats()

    return withCors(NextResponse.json(stats), request)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request)
  }
}
