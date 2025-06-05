import { supabaseAdmin, supabase } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from './supabase'
import { R2Service } from './r2-client'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>
type DocumentUpdate = TablesUpdate<'documents'>

export class SimpleDocumentService {
  
  // Crear documento con archivo - versión simplificada sin logs
  async createDocumentWithFile(
    documentData: Omit<DocumentInsert, 'id' | 'created_at' | 'updated_at' | 'file_url'>, 
    file: File | Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ) {
    try {
      console.log('🚀 Creando documento:', documentData.title)
      
      // 1. Generar clave única para el archivo
      const fileKey = R2Service.generateFileKey(fileName, 'documents')
      console.log('📥 Clave de archivo:', fileKey)
      
      // 2. Convertir archivo a formato adecuado
      let fileBuffer: ArrayBuffer;
      let fileSize: number;
      
      if (file instanceof File) {
        fileBuffer = await file.arrayBuffer();
        fileSize = file.size;
        console.log('📊 Archivo procesado, tamaño:', fileSize, 'bytes')
      } else {
        fileBuffer = file;
        fileSize = fileBuffer.byteLength;
        console.log('📊 Buffer procesado, tamaño:', fileSize, 'bytes')
      }
      
      // 3. Subir archivo a R2
      console.log('☁️ Subiendo archivo a R2...')
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
      console.log('✅ Archivo subido a R2:', fileUrl)

      // 4. Crear documento en Supabase (sin file_key por ahora)
      console.log('📝 Guardando en Supabase...')
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          ...documentData,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: contentType,
          created_by: userId
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error al guardar en Supabase:', error)
        // Limpiar archivo de R2 si falla
        console.log('🗑️ Limpiando archivo de R2...')
        await R2Service.deleteFile(fileKey)
        throw error
      }
      
      console.log('✅ Documento creado con ID:', data.id)
      return data
    } catch (error) {
      console.error('Error creating document:', error)
      throw error
    }
  }

  // Obtener documento por ID
  async getDocumentById(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Actualizar documento
  async updateDocument(id: string, updates: DocumentUpdate) {
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
      // Obtener documento para eliminar archivo de R2
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
          console.error('Error deleting file from R2:', fileError)
        }
      }

      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
}

// Instancia del servicio
export const simpleDocumentService = new SimpleDocumentService()
