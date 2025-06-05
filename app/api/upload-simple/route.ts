import { type NextRequest, NextResponse } from "next/server"
import { simpleDocumentService } from "@/lib/document-service-simple"
import { R2Service } from "@/lib/r2-client"
import { createClient } from '@supabase/supabase-js'
import { validateToken } from '@/lib/auth-utils'

// Verificación de autenticación simplificada
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No token provided', status: 401 }
    }

    const token = authHeader.substring(7)
    
    // Validar token
    const { valid, error } = validateToken(token)
    if (!valid) {
      return { user: null, error: error || 'Invalid token', status: 401 }
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return { user: null, error: 'Invalid token', status: 401 }
    }

    // Verificar admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (adminError || !adminUser) {
      return { user: null, error: 'Not admin', status: 403 }
    }

    return { user, error: null, status: 200 }
  } catch (error) {
    return { user: null, error: 'Auth error', status: 500 }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Nueva subida de documento')
    
    // Verificar autenticación
    const authResult = await verifyAuth(request)
    if (!authResult.user) {
      console.error('❌ Error de auth:', authResult.error)
      return NextResponse.json({ 
        error: authResult.error || "No autorizado" 
      }, { status: authResult.status })
    }
    
    console.log('✅ Usuario autorizado:', authResult.user.email)

    // Obtener datos del formulario
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentData = JSON.parse(formData.get('documentData') as string)

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validaciones básicas
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipo de archivo no permitido" 
      }, { status: 400 })
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: "Archivo demasiado grande (máx 50MB)" 
      }, { status: 400 })
    }

    // Crear documento
    console.log('📄 Creando documento:', documentData.title)
    const document = await simpleDocumentService.createDocumentWithFile(
      documentData,
      file,
      file.name,
      file.type,
      authResult.user.id
    )

    console.log('✅ Documento creado exitosamente')
    return NextResponse.json(document, { status: 201 })

  } catch (error) {
    console.error("❌ Error en upload:", error)
    return NextResponse.json({ 
      error: "Error al subir documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const body = await request.json()
    const document = await simpleDocumentService.updateDocument(documentId, body)

    return NextResponse.json(document)
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ 
      error: "Error al actualizar documento" 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: authResult.status })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    await simpleDocumentService.deleteDocument(documentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ 
      error: "Error al eliminar documento" 
    }, { status: 500 })
  }
}
