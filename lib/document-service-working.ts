// Servicio simplificado de documentos que funciona con la estructura actual de la base de datos
import { supabaseAdmin } from './supabase'
import { R2Service } from './r2-client'

export class SimpleDocumentService {
  
  // Crear documento con archivo - SIMPLIFICADO
  async createDocumentWithFile(
    documentData: any,
    file: File,
    fileName: string,
    contentType: string,
    userId: string
  ) {
    try {
      console.log('🚀 Creando documento:', documentData.title)
      
      // 1. Generar clave única para el archivo
      const fileKey = R2Service.generateFileKey(fileName, 'documents')
      console.log('📥 Clave generada:', fileKey)
      
      // 2. Convertir archivo
      const fileBuffer = await file.arrayBuffer()
      console.log('📊 Archivo procesado, tamaño:', file.size, 'bytes')
      
      // 3. Subir a R2
      console.log('☁️ Subiendo a R2...')
      const fileUrl = await R2Service.uploadFile(
        new Uint8Array(fileBuffer), 
        fileKey, 
        contentType,
        {
          'original-name': fileName,
          'uploaded-by': userId,
          'upload-date': new Date().toISOString()
        }
      )
      console.log('✅ Subido a R2:', fileUrl)

      // 4. Guardar en Supabase - SOLO CAMPOS QUE EXISTEN
      console.log('📝 Guardando en Supabase...')
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          title: documentData.title,
          author: documentData.author,
          category: documentData.category,
          subcategory: documentData.subcategory || null,
          year: documentData.year,
          description: documentData.description || null,
          keywords: documentData.keywords || null,
          editorial: documentData.editorial || null,
          isbn: documentData.isbn || null,
          pages: documentData.pages || null,
          location: documentData.location || null,
          type: documentData.type,
          featured: documentData.featured || false,
          file_url: fileUrl,
          file_name: fileName,
          file_size: file.size,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error en Supabase:', error)
        // Limpiar archivo de R2
        console.log('🗑️ Limpiando R2...')
        await R2Service.deleteFile(fileKey)
        throw error
      }
      
      console.log('✅ Documento creado:', data.id)
      return data

    } catch (error) {
      console.error('Error creando documento:', error)
      throw error
    }
  }

  // Obtener documento por ID
  async getDocumentById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Actualizar documento
  async updateDocument(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Eliminar documento
  async deleteDocument(id: string) {
    try {
      // Obtener documento para eliminar archivo
      const document = await this.getDocumentById(id)
      
      // Eliminar de Supabase
      const { error } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Eliminar archivo de R2 si existe
      if (document.file_url) {
        try {
          const fileKey = R2Service.extractKeyFromUrl(document.file_url)
          await R2Service.deleteFile(fileKey)
        } catch (fileError) {
          console.error('Error eliminando archivo:', fileError)
        }
      }

      return true
    } catch (error) {
      console.error('Error eliminando documento:', error)
      throw error
    }
  }
}

// Instancia del servicio
export const simpleDocumentService = new SimpleDocumentService()
