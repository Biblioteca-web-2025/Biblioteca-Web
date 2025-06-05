import { type NextRequest, NextResponse } from "next/server"
import { documentService } from "@/lib/document-service-r2"
import { R2Service } from "@/lib/r2-client"
import { handleCors, withCors } from '@/lib/cors'
import { withAuth } from '@/lib/api-auth'

// Tipos para procesar documentos
interface DocumentMetadata {
  title: string
  author: string
  description: string
  type: string
  category: string
  year: string
  keywords?: string
  pages?: number
  editorial?: string
  isbn?: string
  location?: string
  featured: boolean
}

// Manejadores de métodos HTTP
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function POST(request: NextRequest) {
  // Manejar CORS primero
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  // Usar middleware de autenticación
  return withAuth(request, async (req, token, userId) => {
    try {
      console.log('✅ Autenticación verificada para usuario:', userId);
      
      // Procesar la solicitud
      const formData = await request.formData()
      const file = formData.get('file') as File
      const documentData = JSON.parse(formData.get('documentData') as string) as DocumentMetadata
      
      if (!file) {
        return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 })
      }
      
      // Validar tipo de archivo
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
      ]
      
      if (!allowedTypes.includes(file.type)) {
        console.log('Tipo de archivo no permitido:', file.type)
        return NextResponse.json({ 
          error: "Tipo de archivo no permitido",
          allowedTypes 
        }, { status: 400 })
      }
      
      // Validar tamaño de archivo (50MB máximo)
      const maxSize = 50 * 1024 * 1024 // 50MB en bytes
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: "El archivo es demasiado grande. El tamaño máximo es 50MB."
        }, { status: 400 })
      }
      
      // Procesar imagen de portada si se proporciona
      let coverImage = formData.get('coverImage') as File | null
      
      // Subir documento
      console.log('📁 Iniciando subida de documento:', documentData.title)
      const document = await documentService.createDocument({
        file,
        coverImage,
        title: documentData.title,
        author: documentData.author,
        description: documentData.description,
        type: documentData.type,
        category: documentData.category, 
        year: documentData.year,
        createdBy: userId,
        keywords: documentData.keywords,
        pages: documentData.pages,
        editorial: documentData.editorial,
        isbn: documentData.isbn,
        location: documentData.location,
        featured: documentData.featured || false
      })
      
      console.log('✅ Documento creado exitosamente:', document.id)
      
      // Verificar que los archivos se hayan subido a R2 correctamente
      if (document.file_url) {
        const fileKey = R2Service.extractKeyFromUrl(document.file_url)
        const fileExists = await R2Service.fileExists(fileKey)
        
        if (!fileExists) {
          console.warn('⚠️ El archivo principal del documento no se encontró en R2 después de la subida')
        } else {
          console.log('✅ Archivo principal verificado en R2:', fileKey)
        }
      }
      
      if (document.cover_image_url) {
        const coverKey = R2Service.extractKeyFromUrl(document.cover_image_url)
        const coverExists = await R2Service.fileExists(coverKey)
        
        if (!coverExists) {
          console.warn('⚠️ La imagen de portada no se encontró en R2 después de la subida')
        } else {
          console.log('✅ Imagen de portada verificada en R2:', coverKey)
        }
      }
      
      return NextResponse.json(document, { status: 201 })
    } catch (error) {
      console.error('❌ Error procesando subida de documento:', error)
      return NextResponse.json({ 
        error: "Error al subir documento", 
        message: error instanceof Error ? error.message : "Error desconocido" 
      }, { status: 500 })
    }
  });
}
