import { supabaseAdmin } from './supabase'
import { R2Service } from './r2-client'

export class DocumentServiceComplete {
  
  // Crear documento con archivo y imagen de portada
  async createDocumentWithFile(
    documentData: any,
    file: File,
    fileName: string,
    contentType: string,
    userId: string,
    coverImage?: File
  ) {
    try {
      console.log('🚀 Creando documento completo:', documentData.title)
      
      // 1. Subir archivo principal
      const fileKey = R2Service.generateFileKey(fileName, 'documents')
      const fileBuffer = await file.arrayBuffer()
      
      console.log('☁️ Subiendo archivo principal a R2...')
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
      console.log('✅ Archivo principal subido:', fileUrl)

      // 2. Subir imagen de portada si se proporciona
      let coverImageUrl = null
      let coverImageKey = null
      
      if (coverImage) {
        console.log('🖼️ Subiendo imagen de portada...')
        coverImageKey = R2Service.generateFileKey(coverImage.name, 'covers')
        const coverBuffer = await coverImage.arrayBuffer()
        
        coverImageUrl = await R2Service.uploadFile(
          new Uint8Array(coverBuffer),
          coverImageKey,
          coverImage.type,
          {
            'original-name': coverImage.name,
            'uploaded-by': userId,
            'upload-date': new Date().toISOString(),
            'type': 'cover-image'
          }
        )
        console.log('✅ Imagen de portada subida:', coverImageUrl)
      }

      // 3. Guardar en Supabase con TODOS los campos
      console.log('📝 Guardando en Supabase...')
      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          title: documentData.title,
          author: documentData.author || null,
          category: documentData.category,
          subcategory: documentData.subcategory || null,
          year: documentData.year || null,
          description: documentData.description,
          keywords: documentData.keywords || null,
          editorial: documentData.editorial || null,
          isbn: documentData.isbn || null,
          pages: documentData.pages || null,
          location: documentData.location || null,
          type: documentData.type || 'document',
          featured: documentData.featured || false,
          
          // URLs de archivos
          file_url: fileUrl,
          cover_image_url: coverImageUrl,
          
          // Metadatos de archivos
          file_name: fileName,
          file_size: file.size,
          file_key: fileKey,
          file_type: contentType,
          cover_image_key: coverImageKey,
          
          // Usuario y fechas
          created_by: userId,
          user_id: userId,
          upload_date: new Date().toISOString(),
          status: documentData.status || 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error en Supabase:', error)
        
        // Limpiar archivos de R2 en caso de error
        console.log('🗑️ Limpiando archivos de R2...')
        try {
          await R2Service.deleteFile(fileKey)
          if (coverImageKey) {
            await R2Service.deleteFile(coverImageKey)
          }
        } catch (cleanupError) {
          console.error('Error limpiando archivos:', cleanupError)
        }
        
        throw error
      }
      
      console.log('✅ Documento creado exitosamente:', data.id)
      return data

    } catch (error) {
      console.error('❌ Error creando documento:', error)
      throw error
    }  }

  // Obtener documentos con paginación y filtros
  async getDocuments(options: {
    page?: number;
    limit?: number;
    category?: string;
    type?: string;
    search?: string;
    userId?: string;
    status?: string;
  } = {}) {
    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available')
      }

      const { page = 1, limit = 10, category, type, search, userId, status } = options
      const offset = (page - 1) * limit

      console.log('📋 getDocuments llamado con opciones:', { page, limit, category, type, search, userId, status });
      
      let query = supabaseAdmin
        .from('documents')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filtrar por status (por defecto solo activos)
      if (status) {
        query = query.eq('status', status)
      } else {
        query = query.eq('status', 'active')
      }

      // Filtrar por categoría
      if (category) {
        query = query.eq('category', category)
      }

      // Filtrar por tipo
      if (type) {
        query = query.eq('type', type)
      }

      // Filtrar por usuario
      if (userId) {
        query = query.eq('user_id', userId)
      }      // Búsqueda por texto
      if (search) {
        console.log('🔍 Aplicando filtro de búsqueda:', search)
        console.log('🔍 Consulta OR que se aplicará:', `title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%,keywords.ilike.%${search}%`)
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%,keywords.ilike.%${search}%`)
        console.log('🔍 Filtro de búsqueda aplicado exitosamente')
      } else {
        console.log('🔍 No se proporcionó término de búsqueda')
      }

      // Paginación
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error obteniendo documentos:', error)
        throw error
      }

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        documents: data || [],
        total: count || 0,
        page,
        totalPages,
        limit
      }
    } catch (error) {
      console.error('❌ Error en getDocuments:', error)
      throw error
    }
  }

  // Obtener documento por ID
  async getDocumentById(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('❌ Error obteniendo documento:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('❌ Error en getDocumentById:', error)
      throw error
    }
  }

  // Actualizar documento con nuevo archivo opcional
  async updateDocumentWithFile(
    id: string,
    updateData: any,
    newFile?: File,
    newFileName?: string,
    newContentType?: string,
    userId?: string,
    newCoverImage?: File
  ) {
    try {
      console.log(`🔄 Actualizando documento: ${id}`)
      
      // Obtener documento actual
      const currentDocument = await this.getDocumentById(id)
      if (!currentDocument) {
        throw new Error('Documento no encontrado')
      }

      let fileUrl = currentDocument.file_url
      let fileKey = currentDocument.file_key
      let fileSize = currentDocument.file_size
      let fileType = currentDocument.file_type
      
      let coverImageUrl = currentDocument.cover_image_url
      let coverImageKey = currentDocument.cover_image_key

      // Actualizar archivo principal si se proporciona uno nuevo
      if (newFile && newFileName && newContentType) {
        console.log('📁 Actualizando archivo principal...')
        
        // Generar nueva clave y subir nuevo archivo
        const newFileKey = R2Service.generateFileKey(newFileName, 'documents')
        const fileBuffer = await newFile.arrayBuffer()
        
        const newFileUrl = await R2Service.uploadFile(
          new Uint8Array(fileBuffer),
          newFileKey,
          newContentType,
          {
            'original-name': newFileName,
            'uploaded-by': userId || 'system',
            'upload-date': new Date().toISOString()
          }
        )

        // Eliminar archivo anterior
        if (fileKey) {
          try {
            await R2Service.deleteFile(fileKey)
          } catch (error) {
            console.warn('No se pudo eliminar archivo anterior:', error)
          }
        }

        fileUrl = newFileUrl
        fileKey = newFileKey
        fileSize = newFile.size
        fileType = newContentType
      }

      // Actualizar imagen de portada si se proporciona una nueva
      if (newCoverImage) {
        console.log('🖼️ Actualizando imagen de portada...')
        
        const newCoverKey = R2Service.generateFileKey(newCoverImage.name, 'covers')
        const coverBuffer = await newCoverImage.arrayBuffer()
        
        const newCoverUrl = await R2Service.uploadFile(
          new Uint8Array(coverBuffer),
          newCoverKey,
          newCoverImage.type,
          {
            'original-name': newCoverImage.name,
            'uploaded-by': userId || 'system',
            'upload-date': new Date().toISOString(),
            'type': 'cover-image'
          }
        )

        // Eliminar imagen anterior
        if (coverImageKey) {
          try {
            await R2Service.deleteFile(coverImageKey)
          } catch (error) {
            console.warn('No se pudo eliminar imagen anterior:', error)
          }
        }

        coverImageUrl = newCoverUrl
        coverImageKey = newCoverKey
      }

      // Actualizar en base de datos
      const { data, error } = await supabaseAdmin
        .from('documents')
        .update({
          ...updateData,
          file_url: fileUrl,
          file_key: fileKey,
          file_size: fileSize,
          file_type: fileType,
          cover_image_url: coverImageUrl,
          cover_image_key: coverImageKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error actualizando documento:', error)
        throw error
      }

      console.log('✅ Documento actualizado exitosamente')
      return data
    } catch (error) {
      console.error('❌ Error en updateDocumentWithFile:', error)
      throw error
    }
  }

  // Eliminar documento
  async deleteDocument(id: string, userId?: string) {
    try {
      console.log(`🗑️ Eliminando documento: ${id}`)
      
      // Obtener documento para eliminar archivos
      const document = await this.getDocumentById(id)
      if (!document) {
        throw new Error('Documento no encontrado')
      }

      // Marcar como eliminado en lugar de eliminar físicamente
      const { error } = await supabaseAdmin
        .from('documents')
        .update({ 
          status: 'deleted',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('❌ Error eliminando documento:', error)
        throw error
      }

      // Eliminar archivos de R2
      try {
        if (document.file_key) {
          await R2Service.deleteFile(document.file_key)
        }
        if (document.cover_image_key) {
          await R2Service.deleteFile(document.cover_image_key)
        }
      } catch (fileError) {
        console.warn('Error eliminando archivos:', fileError)
      }

      console.log('✅ Documento eliminado exitosamente')
      return true
    } catch (error) {
      console.error('❌ Error en deleteDocument:', error)
      throw error
    }
  }
}

// Instancia por defecto
export const documentServiceComplete = new DocumentServiceComplete()
