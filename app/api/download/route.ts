import { type NextRequest, NextResponse } from "next/server"
import { documentService } from "@/lib/document-service-r2"
import { R2Service } from "@/lib/r2-client"
import { handleCors, withCors } from '@/lib/cors'

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function GET(request: NextRequest) {
  try {
    // Manejar CORS
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    const preview = searchParams.get('preview') === 'true'

    if (!documentId) {
      const errorResponse = NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
      return withCors(errorResponse, request)
    }    // Obtener información del documento
    const document = await documentService.getDocumentById(documentId)
    
    if (!document || !document.file_url) {
      const errorResponse = NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      return withCors(errorResponse, request)
    }    // Si es preview, simplemente retornar la URL del archivo para visualización
    if (preview) {
      const successResponse = NextResponse.json({ 
        url: document.file_url,
        fileName: document.file_name,
        contentType: document.file_url.includes('.pdf') ? 'application/pdf' : 'application/octet-stream'
      })
      return withCors(successResponse, request)
    }

    // Para descarga, incrementar contador y redirigir
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    // Incrementar contador de descargas
    await documentService.incrementDownloads(documentId, userIp, userAgent)

    // Generar URL firmada para descarga segura (opcional, si quieres mayor control)
    const fileKey = R2Service.extractKeyFromUrl(document.file_url)
    const signedUrl = await R2Service.getSignedUrl(fileKey, 3600) // 1 hora de expiración    // Retornar la URL para descarga directa
    const successResponse = NextResponse.json({
      downloadUrl: signedUrl,
      fileName: document.file_name,
      fileSize: document.file_size
    })
    return withCors(successResponse, request)

  } catch (error) {
    console.error("Error downloading document:", error)
    const errorResponse = NextResponse.json({ 
      error: "Error al descargar el documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
    return withCors(errorResponse, request)
  }
}

// Proxy de descarga directa (alternativa)
export async function POST(request: NextRequest) {
  try {
    // Manejar CORS
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    const { documentId } = await request.json()

    if (!documentId) {
      const errorResponse = NextResponse.json({ error: "ID de documento requerido" }, { status: 400 })
      return withCors(errorResponse, request)
    }

    // Obtener información del documento
    const document = await documentService.getDocumentById(documentId)
    
    if (!document || !document.file_url) {
      const errorResponse = NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
      return withCors(errorResponse, request)
    }

    // Incrementar contador de descargas
    const userIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    
    await documentService.incrementDownloads(documentId, userIp, userAgent)

    // Obtener archivo de R2 y streamear al cliente
    const fileKey = R2Service.extractKeyFromUrl(document.file_url)
      // Para archivos grandes, mejor usar redirect a URL firmada
    const signedUrl = await R2Service.getSignedUrl(fileKey, 300) // 5 minutos

    const redirectResponse = NextResponse.redirect(signedUrl)
    return withCors(redirectResponse, request)

  } catch (error) {
    console.error("Error in download proxy:", error)
    const errorResponse = NextResponse.json({ 
      error: "Error al procesar la descarga",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
    return withCors(errorResponse, request)
  }
}
