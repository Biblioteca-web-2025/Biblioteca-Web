import { type NextRequest, NextResponse } from "next/server"
import { documentService } from "@/lib/document-service-r2"
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const year = searchParams.get("year")
    const featured = searchParams.get("featured")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    let result

    if (search) {
      result = await documentService.searchDocuments(search, page, limit)
    } else if (type || category || year || featured !== null) {
      result = await documentService.filterDocuments({
        type: type || undefined,
        category: category || undefined,
        year: year || undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        page,
        limit
      })
    } else {
      result = await documentService.getAllDocuments(page, limit)
    }

    return withCors(NextResponse.json(result), request)
  } catch (error) {
    console.error("Error fetching documents:", error)
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const user = await verifyAdminAuth(request)
    if (!user) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request)
    }

    const body = await request.json()

    const document = await documentService.createDocument(body, user.id)

    // Log de actividad con información del usuario
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    await documentService.logActivity(
      "document_created", 
      document.id, 
      user.id, 
      { document_title: body.title },
      userIp,
      userAgent
    )

    return withCors(NextResponse.json(document, { status: 201 }), request)
  } catch (error) {
    console.error("Error creating document:", error)
    return withCors(NextResponse.json({ error: "Error al crear el documento" }, { status: 500 }), request)
  }
}
