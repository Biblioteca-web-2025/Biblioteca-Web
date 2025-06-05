// API route completa para subir documentos con imagen de portada
import { type NextRequest, NextResponse } from "next/server"
import { simpleDocumentService } from "@/lib/document-service-working"
import { createClient } from '@supabase/supabase-js'
import { validateToken } from '@/lib/auth-utils'

// Función para verificar autenticación de administrador
async function verifyAdminAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No authentication token provided', status: 401 }
    }

    const token = authHeader.substring(7)
      // Usar la función de validación de token desde auth-utils
    const { valid, payload, error } = validateToken(token)
    
    if (!valid) {
      console.log(`Token validation failed: ${error}`)
      return { user: null, error: error || 'Invalid token', status: 401 }
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return { user: null, error: userError?.message || 'Invalid authentication token', status: 401 }
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

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    console.log('👤 Verificando autenticación para subida de documentos')
    const authResult = await verifyAdminAuth(request)
    const { user, error, status } = authResult
    
    if (!user) {
      console.error('❌ Error de autenticación:', error, 'Status:', status)
      return NextResponse.json({ 
        error: error || "No autorizado", 
        details: "La sesión ha expirado o no tiene permisos suficientes" 
      }, { status })
    }
    
    console.log('✅ Usuario autenticado:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const coverImage = formData.get('coverImage') as File | null
    const documentData = JSON.parse(formData.get('documentData') as string)

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo principal" }, { status: 400 })
    }

    // Validar tipo de archivo principal
    const allowedFileTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ]

    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Tipo de archivo no permitido. Solo se permiten PDF, documentos de Office y archivos de texto." 
      }, { status: 400 })
    }

    // Validar tipo de imagen de portada si se proporciona
    if (coverImage) {
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedImageTypes.includes(coverImage.type)) {
        return NextResponse.json({ 
          error: "Tipo de imagen no permitido. Solo se permiten JPEG, PNG, GIF y WebP." 
        }, { status: 400 })
      }
    }

    // Validar tamaño de archivos
    const maxFileSize = 50 * 1024 * 1024 // 50MB
    const maxImageSize = 10 * 1024 * 1024 // 10MB

    if (file.size > maxFileSize) {
      return NextResponse.json({ 
        error: "El archivo es demasiado grande. El tamaño máximo es 50MB." 
      }, { status: 400 })
    }

    if (coverImage && coverImage.size > maxImageSize) {
      return NextResponse.json({ 
        error: "La imagen de portada es demasiado grande. El tamaño máximo es 10MB." 
      }, { status: 400 })
    }

    // Crear documento con archivo usando el servicio completo
    console.log('📤 Subiendo documento completo:', documentData.title)

    const document = await simpleDocumentService.createDocumentWithFile(
      documentData,
      file,
      file.name,
      file.type,
      user.id,
      coverImage || undefined
    )

    console.log('✅ Documento completo creado exitosamente:', document.title)

    return NextResponse.json(document, { status: 201 })
    
  } catch (error) {
    console.error("Error uploading complete document:", error)
    return NextResponse.json({ 
      error: "Error al subir el documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

// Actualizar archivo de documento existente
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación de administrador
    const { user, error, status } = await verifyAdminAuth(request)
    if (!user) {
      return NextResponse.json({ error: error || "No autorizado" }, { status })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    const updateType = searchParams.get('type') // 'file' o 'cover'

    if (!documentId) {
      return NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
    }

    const formData = await request.formData()
    
    if (updateType === 'cover') {
      // Actualizar solo imagen de portada
      const coverImage = formData.get('coverImage') as File
      
      if (!coverImage) {
        return NextResponse.json({ error: "No se proporcionó imagen de portada" }, { status: 400 })
      }

      const document = await simpleDocumentService.updateCoverImage(documentId, coverImage)
      return NextResponse.json(document)
      
    } else {
      // Actualizar archivo principal
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
      }

      const document = await simpleDocumentService.updateDocumentFile(
        documentId,
        file,
        file.name,
        file.type,
        user.id
      )
      return NextResponse.json(document)
    }

  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ 
      error: "Error al actualizar el documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
