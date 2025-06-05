// This is a temporary modified version of document-service-r2.ts that works without the file_key column
// After running the migration script on your Supabase database, you can delete this file

import { supabaseAdmin, supabase } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from './supabase'
import { R2Service } from './r2-client'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>
type DocumentUpdate = TablesUpdate<'documents'>

export class SupabaseDocumentService {
  
  // Existing methods remain unchanged...

  // Modified createDocumentWithFile method that doesn't use file_key
  async createDocumentWithFile(
    documentData: Omit<DocumentInsert, 'id' | 'created_at' | 'updated_at' | 'file_url'>, 
    file: File | Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ) {
    try {
      console.log('🚀 Iniciando proceso de creación de documento:', documentData.title)
      
      // 1. Generar clave única para el archivo
      const fileKey = R2Service.generateFileKey(fileName, 'documents')
      console.log('📥 Clave de archivo generada:', fileKey)
      
      // 2. Convertir archivo a formato adecuado
      let fileBuffer: ArrayBuffer;
      let fileSize: number;
      
      if (file instanceof File) {
        try {
          fileBuffer = await file.arrayBuffer();
          fileSize = file.size;
          console.log('📊 Archivo convertido a ArrayBuffer, tamaño:', fileSize, 'bytes')
        } catch (err) {
          console.error('❌ Error al convertir File a ArrayBuffer:', err)
          throw new Error('Error al procesar el archivo: ' + (err instanceof Error ? err.message : String(err)))
        }
      } else {
        fileBuffer = file;
        fileSize = fileBuffer.byteLength;
        console.log('📊 Buffer recibido directamente, tamaño:', fileSize, 'bytes')
      }
      
      // 3. Subir archivo a R2
      console.log('☁️ Subiendo archivo a R2 storage...')
      const fileUrl = await R2Service.uploadFile(
        new Uint8Array(fileBuffer), 
        fileKey, 
        contentType,
        {
          'original-name': fileName,
          'uploaded-by': userId,
          'upload-date': new Date().toISOString(),
          'content-type': contentType
        }
      )
      console.log('✅ Archivo subido exitosamente a R2, URL:', fileUrl)

      // 4. Crear documento en Supabase con URL del archivo (sin file_key)
      console.log('📝 Guardando metadatos en Supabase (sin file_key)...')
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          ...documentData,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          file_type: contentType,
          created_by: userId
          // file_key is intentionally omitted until database schema is updated
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error al guardar en Supabase:', error)
        // Si falla la creación del documento, eliminar el archivo de R2
        console.log('🗑️ Limpiando archivo de R2 por fallo en Supabase...')
        await R2Service.deleteFile(fileKey)
        throw error
      }
      
      console.log('✅ Metadatos guardados en Supabase, ID:', data.id)

      // Registrar actividad
      await this.logActivity('document_created', data.id, userId, {
        fileName,
        fileKey, // Store in activity log for reference
        fileSize: file instanceof File ? file.size : fileBuffer.byteLength
      })

      return data
    } catch (error) {
      console.error('Error creating document with file:', error)
      throw error
    }
  }

  // Rest of the class remains unchanged...
}

// Instancia singleton del servicio
export const documentServiceTemp = new SupabaseDocumentService()
