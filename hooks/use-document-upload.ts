import { useState } from 'react'

interface DocumentData {
  title: string
  description?: string
  author: string
  year: string
  type: string
  category?: string
  keywords?: string
  featured?: boolean
}

interface UploadResponse {
  id: string
  title: string
  file_url: string
  file_name: string
  file_size: number
  created_at: string
}

interface UploadError {
  error: string
  details?: string
}

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const uploadDocument = async (
    file: File,
    documentData: DocumentData,
    authToken: string
  ): Promise<UploadResponse> => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Validaciones básicas antes de iniciar la subida
      if (!authToken) {
        throw new Error('No se proporcionó token de autenticación. Por favor inicie sesión nuevamente.')
      }

      if (!file) {
        throw new Error('No se proporcionó ningún archivo para subir')
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('El archivo excede el tamaño máximo permitido (50MB)')
      }

      console.log('📤 Iniciando subida de documento con token:', authToken.substring(0, 15) + '...')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentData', JSON.stringify(documentData))
      
      // Simular progreso de subida para dar feedback al usuario
      const simulateProgress = setInterval(() => {
        setUploadProgress(prev => {
          const nextProgress = prev + Math.random() * 15
          return nextProgress < 90 ? nextProgress : prev
        })
      }, 500)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData: UploadError = await response.json()
        throw new Error(errorData.error || 'Error al subir el documento')
      }

      const result: UploadResponse = await response.json()
      setUploadProgress(100)
      return result    } catch (error) {
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const updateDocumentFile = async (
    documentId: string,
    file: File,
    authToken: string
  ): Promise<UploadResponse> => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/upload?id=${documentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      })

      setUploadProgress(100)

      if (!response.ok) {
        const errorData: UploadError = await response.json()
        throw new Error(errorData.error || 'Error al actualizar el archivo')
      }

      const result: UploadResponse = await response.json()
      return result    } catch (error) {
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const downloadDocument = async (documentId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/download?id=${documentId}`)

      if (!response.ok) {
        throw new Error('Error al obtener el enlace de descarga')
      }

      const data = await response.json()
      return data.downloadUrl    } catch (error) {
      throw error
    }
  }

  const previewDocument = async (documentId: string): Promise<{ url: string; fileName: string; contentType: string }> => {
    try {
      const response = await fetch(`/api/download?id=${documentId}&preview=true`)

      if (!response.ok) {
        throw new Error('Error al obtener el enlace de vista previa')
      }

      const data = await response.json()
      return data

    } catch (error) {
      throw error
    }
  }

  return {
    isUploading,
    uploadProgress,
    uploadDocument,
    updateDocumentFile,
    downloadDocument,
    previewDocument
  }
}

export default useDocumentUpload
