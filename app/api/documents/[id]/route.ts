import { type NextRequest, NextResponse } from "next/server"
import { documentService } from "@/lib/document-service-r2"
import { createClient } from '@supabase/supabase-js'
import { handleCors, withCors } from '@/lib/cors'

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

// Función para verificar autenticación de administrador
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    
    // Validación básica del formato JWT (debe tener 3 partes separadas por punto)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return { user: null, error: 'Invalid token format', status: 401 }
    }
    
    // Intentar decodificar el payload (sin verificación, solo para verificar expiración)
    try {
      // Verificar que la parte del payload exista
      if (!tokenParts[1]) {
        return { user: null, error: 'Token payload missing', status: 401 }
      }
      
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      // Verificar expiración
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return { user: null, error: 'Token expired', status: 401 }
      }
    } catch (e) {
      return { user: null, error: 'Invalid token payload', status: 401 }
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid authentication token', status: 401 }
    }

    // Verificar que es administrador
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (adminError || !adminUser) {
      return { user: null, error: 'User does not have admin privileges', status: 403 }
    }

    return { user, error: null, status: 200 }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { user: null, error: 'Authentication error', status: 500 }
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const document = await documentService.getDocumentById(params.id)

    if (!document) {
      return withCors(NextResponse.json({ error: "Documento no encontrado" }, { status: 404 }), request)
    }

    // Incrementar contador de vistas
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    await documentService.incrementViews(params.id, userIp, userAgent)

    return withCors(NextResponse.json(document), request)
  } catch (error) {
    console.error("Error fetching document:", error)
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación de administrador
    const { user, error, status } = await verifyAdminAuth(request)
    if (!user) {
      return withCors(NextResponse.json({ error: error || "No autorizado" }, { status }), request)
    }

    const body = await request.json()

    const document = await documentService.updateDocument(params.id, body, user.id)

    return withCors(NextResponse.json(document), request)
  } catch (error) {
    console.error("Error updating document:", error)
    return withCors(NextResponse.json({ error: "Error al actualizar el documento" }, { status: 500 }), request)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log('🗑️ DELETE request recibido para documento:', params.id)
  
  try {
    // Verificar autenticación de administrador
    console.log('🔐 Verificando autenticación...')
    const { user, error, status } = await verifyAdminAuth(request)
    
    if (!user) {
      console.error('❌ Autenticación fallida:', error, 'Status:', status)
      return withCors(NextResponse.json({ error: error || "No autorizado" }, { status }), request)
    }
    
    console.log('✅ Usuario autenticado:', user.id)
    console.log('🗑️ Eliminando documento con servicio...')
    
    await documentService.deleteDocument(params.id, user.id)
    
    console.log('✅ Documento eliminado exitosamente')
    return withCors(NextResponse.json({ success: true }), request)
  } catch (error) {
    console.error("❌ Error deleting document:", error)
    return withCors(NextResponse.json({ 
      error: error instanceof Error ? error.message : "Error al eliminar el documento" 
    }, { status: 500 }), request)
  }
}
