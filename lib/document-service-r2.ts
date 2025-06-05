import { supabaseAdmin, supabase } from './supabase'
import type { Tables, TablesInsert, TablesUpdate } from './supabase'
import { R2Service } from './r2-client'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>
type DocumentUpdate = TablesUpdate<'documents'>

export class SupabaseDocumentService {
    // Obtener todos los documentos con paginación
  async getAllDocuments(page = 1, limit = 10, orderBy = 'created_at', ascending = false) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('documents')
      .select('*, document_stats(*)', { count: 'exact' })
      .order(orderBy, { ascending })
      .range(from, to)

    if (error) throw error

    return {
      documents: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
  // Obtener documento por ID
  async getDocumentById(id: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*, document_stats(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }
  // Obtener documentos destacados
  async getFeaturedDocuments(limit = 6) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*, document_stats(*)')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
  // Buscar documentos
  async searchDocuments(query: string, page = 1, limit = 10) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('documents')
      .select('*, document_stats(*)', { count: 'exact' })
      .or(`title.ilike.%${query}%, author.ilike.%${query}%, description.ilike.%${query}%, keywords.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      documents: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }  // Crear documento con archivo (solo administradores)
  async createDocumentWithFile(
    documentData: Omit<DocumentInsert, 'id' | 'created_at' | 'updated_at' | 'file_url'>, 
    file: File | Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }

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
        }      } else {
        // Convert Buffer to ArrayBuffer properly
        if (file.buffer instanceof ArrayBuffer) {
          fileBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        } else {
          // Handle SharedArrayBuffer case
          const tempBuffer = new ArrayBuffer(file.length);
          const tempView = new Uint8Array(tempBuffer);
          const sourceView = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
          tempView.set(sourceView);
          fileBuffer = tempBuffer;
        }
        fileSize = file.length;
        console.log('📊 Buffer convertido a ArrayBuffer, tamaño:', fileSize, 'bytes')
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

      // 4. Crear documento en Supabase con URL del archivo
      console.log('📝 Guardando metadatos en Supabase...')
      
      // Preparar datos para insertar
      const insertData: any = {
        ...documentData,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        created_by: userId
      }
      
      // Solo incluir file_type, omitir file_key por ahora hasta que se actualice la base de datos
      // Esto permite compatibilidad con bases de datos que aún no han migrado
      try {
        // Omitimos file_key temporalmente hasta que la base de datos se actualice
        // insertData.file_key = fileKey
        insertData.file_type = contentType
        
        const { data, error } = await supabaseAdmin
          .from('documents')
          .insert(insertData)
          .select()
          .single()

        if (error) {
          // Si el error es específicamente sobre file_key column not found
          if (error.message && error.message.includes("file_key")) {
            console.warn('⚠️ La columna file_key no existe en la tabla documents. Intentando sin ese campo.')
            // Eliminar el campo file_key y reintentar
            delete insertData.file_key
            
            const retryResult = await supabaseAdmin
              .from('documents')
              .insert(insertData)
              .select()
              .single()
              
            if (retryResult.error) {
              throw retryResult.error
            }
            
            console.log('✅ Metadatos guardados en Supabase, ID:', retryResult.data.id)

            // 5. Registrar actividad
            await this.logActivity('document_created', retryResult.data.id, userId, {
              fileName,
              fileSize
            })

            return retryResult.data
          } else {
            throw error
          }
        }
        
        console.log('✅ Metadatos guardados en Supabase, ID:', data.id)

        // 5. Registrar actividad
        await this.logActivity('document_created', data.id, userId, {
          fileName,
          fileSize
        })

        return data
      } catch (error) {
        console.error('❌ Error al guardar en Supabase:', error)
        // Si falla la creación del documento, eliminar el archivo de R2
        console.log('🗑️ Limpiando archivo de R2 por fallo en Supabase...')
        await R2Service.deleteFile(fileKey)
        throw error
      }
    } catch (error) {
      console.error('Error creating document with file:', error)
      throw error
    }
  }
  // Actualizar archivo de documento
  async updateDocumentFile(
    documentId: string,
    file: File | Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }

    try {
      // 1. Obtener documento actual
      const currentDoc = await this.getDocumentById(documentId)
      
      // 2. Generar nueva clave para el archivo
      const newFileKey = R2Service.generateFileKey(fileName, 'documents')
        // 3. Subir nuevo archivo a R2
      let fileBuffer: ArrayBuffer;
      let fileSize: number;
      
      if (file instanceof File) {
        fileBuffer = await file.arrayBuffer();
        fileSize = file.size;
      } else {
        // Convert Buffer to ArrayBuffer properly
        if (file.buffer instanceof ArrayBuffer) {
          fileBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        } else {
          // Handle SharedArrayBuffer case
          const tempBuffer = new ArrayBuffer(file.length);
          const tempView = new Uint8Array(tempBuffer);
          const sourceView = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
          tempView.set(sourceView);
          fileBuffer = tempBuffer;
        }
        fileSize = file.length;
      }
      
      const newFileUrl = await R2Service.uploadFile(
        new Uint8Array(fileBuffer), 
        newFileKey, 
        contentType,
        {
          'original-name': fileName,
          'updated-by': userId,
          'update-date': new Date().toISOString()
        }
      )

      // 4. Actualizar documento en Supabase
      const { data, error } = await supabaseAdmin
        .from('documents')
        .update({
          file_url: newFileUrl,
          file_name: fileName,
          file_size: fileSize,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        // Si falla la actualización, eliminar el nuevo archivo
        await R2Service.deleteFile(newFileKey)
        throw error
      }

      // 5. Eliminar archivo anterior de R2
      if (currentDoc.file_url) {
        try {
          const oldFileKey = R2Service.extractKeyFromUrl(currentDoc.file_url)
          await R2Service.deleteFile(oldFileKey)
        } catch (deleteError) {
          console.error('Error deleting old file from R2:', deleteError)
          // No fallar la operación principal
        }
      }

      // 6. Registrar actividad
      await this.logActivity('document_file_updated', documentId, userId, {
        oldFileName: currentDoc.file_name,
        newFileName: fileName,
        newFileSize: file instanceof File ? file.size : fileBuffer.byteLength
      })

      return data
    } catch (error) {
      console.error('Error updating document file:', error)
      throw error
    }
  }
  // Crear documento sin archivo (solo administradores)
  async createDocument(
    documentData: 
      | (Omit<DocumentInsert, 'id' | 'created_at' | 'updated_at'> & { created_by?: string }) 
      | {
          file: File,
          coverImage?: File | null,
          title: string,
          author: string,
          description: string,
          type: string,
          category: string,
          year: string,
          createdBy: string,
          keywords?: string,
          pages?: number,
          editorial?: string,
          isbn?: string,
          location?: string,
          featured: boolean
        }, 
    userId?: string
  ) {
    // Check if this is a file upload request
    if ('file' in documentData && documentData.file) {
      console.log('🔄 Redirecting to createDocumentWithFile for file upload')
      
      // Extract file and cover image
      const { file, coverImage, createdBy, ...docData } = documentData
      
      // Map the data to match createDocumentWithFile signature
      const mappedData = {
        ...docData,
        subcategory: null,
        keywords: docData.keywords || null,
        pages: docData.pages || null,
        editorial: docData.editorial || null,
        isbn: docData.isbn || null,
        location: docData.location || null,
        featured: docData.featured || false,
        created_by: createdBy  // Add this required field
      }
      
      // If there's a cover image, use the complete service
      if (coverImage) {
        console.log('🖼️ Using complete service for document with cover image')
        const { DocumentServiceComplete } = await import('./document-service-complete')
        const completeService = new DocumentServiceComplete()
        
        return await completeService.createDocumentWithFile(
          mappedData,
          file,
          file.name,
          file.type,
          createdBy,
          coverImage
        )
      } else {
        // Use the regular method for document without cover
        console.log('📄 Creating document without cover image')
        return await this.createDocumentWithFile(
          mappedData,
          file,
          file.name,
          file.type,
          createdBy
        )
      }
    }
    
    // Original method for documents without files
    const finalUserId = userId || (documentData as any).createdBy
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }
    
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        ...documentData,
        created_by: finalUserId
      })
      .select()
      .single()

    if (error) throw error

    // Registrar actividad
    await this.logActivity('document_created', data.id, finalUserId)

    return data
  }
  // Actualizar documento
  async updateDocument(id: string, updates: DocumentUpdate, userId: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Registrar actividad
    await this.logActivity('document_updated', id, userId, { updates })

    return data
  }
  // Eliminar documento
  async deleteDocument(id: string, userId: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }

    try {
      // 1. Obtener documento antes de eliminarlo para obtener la URL del archivo
      const document = await this.getDocumentById(id)
      
      // 2. Eliminar documento de Supabase
      const { error } = await supabaseAdmin
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 3. Eliminar archivo de R2 si existe
      if (document.file_url) {
        try {
          const fileKey = R2Service.extractKeyFromUrl(document.file_url)
          await R2Service.deleteFile(fileKey)
        } catch (fileError) {
          console.error('Error deleting file from R2:', fileError)
          // No fallar la operación si no se puede eliminar el archivo
        }
      }

      // 4. Registrar actividad
      await this.logActivity('document_deleted', id, userId, {
        title: document.title,
        fileName: document.file_name
      })

      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
  // Incrementar vistas de documento
  async incrementViews(documentId: string, userIp?: string, userAgent?: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { error } = await supabase.rpc('increment_document_views', {
      p_document_id: documentId
    })

    if (error) throw error

    // Log adicional con información del usuario
    if (userIp || userAgent) {
      await this.logActivity('document_viewed', documentId, undefined, {
        user_ip: userIp,
        user_agent: userAgent
      })
    }

    return true
  }
  // Incrementar descargas de documento
  async incrementDownloads(documentId: string, userIp?: string, userAgent?: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { error } = await supabase.rpc('increment_document_downloads', {
      p_document_id: documentId
    })

    if (error) throw error

    // Log adicional con información del usuario
    if (userIp || userAgent) {
      await this.logActivity('document_downloaded', documentId, undefined, {
        user_ip: userIp,
        user_agent: userAgent
      })
    }

    return true
  }
  // Obtener estadísticas de un documento
  async getDocumentStats(documentId: string) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { data, error } = await supabase
      .from('document_stats')
      .select('*')
      .eq('document_id', documentId)
      .single()

    if (error) throw error
    return data
  }
  // Registrar actividad
  async logActivity(
    action: string, 
    documentId?: string, 
    userId?: string, 
    metadata?: any,
    userIp?: string,
    userAgent?: string
  ) {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not initialized')
      return
    }

    try {
      const { error } = await supabaseAdmin
        .from('activity_logs')
        .insert({
          action,
          document_id: documentId || null,
          user_id: userId || null,
          user_ip: userIp || null,
          user_agent: userAgent || null,
          metadata: metadata ? JSON.stringify(metadata) : null
        })

      if (error) {
        console.error('Error logging activity:', error)
      }
    } catch (error) {
      console.error('Error in logActivity:', error)
    }
  }
  // Obtener estadísticas generales
  async getGeneralStats() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    try {
      const [documentsResult, statsResult] = await Promise.all([
        supabase.from('documents').select('id, type', { count: 'exact', head: true }),
        supabase.from('document_stats').select('views, downloads')
      ])
      
      const totalDocuments = documentsResult.count || 0
      const totalViews = statsResult.data?.reduce((sum: number, stat: any) => sum + stat.views, 0) || 0
      const totalDownloads = statsResult.data?.reduce((sum: number, stat: any) => sum + stat.downloads, 0) || 0

      // Estadísticas por tipo
      const { data: documents } = await supabase.from('documents').select('type')
      const documentsByType = documents?.reduce((acc: Record<string, number>, doc: any) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1
        return acc
      }, {}) || {}

      return {
        totalDocuments,
        totalViews,
        totalDownloads,
        documentsByType
      }
    } catch (error) {
      console.error('Error getting general stats:', error)
      return {
        totalDocuments: 0,
        totalViews: 0,
        totalDownloads: 0,
        documentsByType: {}
      }
    }
  }
  // Filtrar documentos con múltiples criterios
  async filterDocuments(filters: {
    type?: string
    category?: string
    year?: string
    featured?: boolean
    search?: string
    page?: number
    limit?: number
  }) {
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }

    const { 
      type, 
      category, 
      year, 
      featured, 
      search, 
      page = 1, 
      limit = 10 
    } = filters

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('documents')
      .select('*, document_stats(*)', { count: 'exact' })

    if (type) query = query.eq('type', type)
    if (category) query = query.eq('category', category)
    if (year) query = query.eq('year', year)
    if (featured !== undefined) query = query.eq('featured', featured)
    if (search) {
      query = query.or(`title.ilike.%${search}%, author.ilike.%${search}%, description.ilike.%${search}%, keywords.ilike.%${search}%`)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error

    return {
      documents: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      filters
    }
  }

  // Obtener documentos por tipo
  async getDocumentsByType(type: string, page = 1, limit = 10) {
    return this.filterDocuments({ type, page, limit })
  }
  // Obtener logs de actividad (solo administradores)
  async getActivityLogs(page = 1, limit = 50, action?: string) {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client is not initialized')
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*, documents(title), admin_users(email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (action) {
      query = query.eq('action', action)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      logs: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }
}

// Instancia singleton del servicio
export const documentService = new SupabaseDocumentService()
