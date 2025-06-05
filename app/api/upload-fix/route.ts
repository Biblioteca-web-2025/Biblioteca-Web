// This is a temporary modified version of the upload route that works with the temporary document service
// Once you've run the database migration, you can delete this file and rename the original back

import { type NextRequest, NextResponse } from "next/server"
import { documentServiceTemp } from "@/lib/document-service-fix"
import { R2Service } from "@/lib/r2-client"
import { createClient } from '@supabase/supabase-js'
import { handleCors, withCors } from '@/lib/cors'
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
    const { valid, decoded, error } = validateToken(token)
    
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

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function POST(request: NextRequest) {
  try {
    // Manejar CORS
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Verificar autenticación de administrador con logs detallados
    console.log('👤 Verificando autenticación para subida de documentos')
    const authResult = await verifyAdminAuth(request)
    const { user, error, status } = authResult
    
    if (!user) {
      console.error('❌ Error de autenticación:', error, 'Status:', status)
      console.error('Headers de autenticación:', request.headers.get('authorization')?.substring(0, 20) + '...')
      const response = NextResponse.json({ 
        error: error || "No autorizado", 
        details: "La sesión ha expirado o no tiene permisos suficientes" 
      }, { status })
      return withCors(response, request)
    }
    
    console.log('✅ Usuario autenticado:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentData = JSON.parse(formData.get('documentData') as string)

    if (!file) {
      const response = NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
      return withCors(response, request)
    }

    // Validar tipo de archivo (PDF, Word, Excel, PowerPoint, imágenes)
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
      const response = NextResponse.json({ 
        error: "Tipo de archivo no permitido. Solo se permiten PDF, documentos de Office, imágenes y archivos de texto." 
      }, { status: 400 })
      return withCors(response, request)
    }

    // Validar tamaño de archivo (máximo 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      const response = NextResponse.json({ 
        error: "El archivo es demasiado grande. El tamaño máximo es 50MB." 
      }, { status: 400 })
      return withCors(response, request)
    }

    // Crear documento con archivo usando el servicio temporal R2
    console.log('📤 Subiendo documento:', documentData.title)

    const document = await documentServiceTemp.createDocumentWithFile(
      documentData,
      file,
      file.name,
      file.type,
      user.id
    )

    console.log('✅ Documento creado exitosamente:', document.title)

    // Log de actividad con información del usuario
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    await documentServiceTemp.logActivity(
      "document_uploaded", 
      document.id, 
      user.id, 
      { 
        document_title: documentData.title,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      },
      userIp,
      userAgent
    )

    const response = NextResponse.json(document, { status: 201 })
    return withCors(response, request)
  } catch (error) {
    console.error("Error uploading document:", error)
    const response = NextResponse.json({ 
      error: "Error al subir el documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
    return withCors(response, request)
  }
}
