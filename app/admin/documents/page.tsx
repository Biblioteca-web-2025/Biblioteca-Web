"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Upload, FileText, Download, Eye } from 'lucide-react'
import DocumentUploadForm from '@/components/document-upload-form'
import { DocumentTable } from '@/components/document-table'
import { AdminHeader } from '@/components/admin-header'
import { useRouter } from 'next/navigation'
import { useDocumentUpload } from '@/hooks/use-document-upload'
import toast from 'react-hot-toast'

interface Document {
  id: string
  title: string
  author: string
  type: string
  category?: string
  year: string
  file_name?: string
  file_size?: number
  file_url?: string
  featured: boolean
  created_at: string
  updated_at: string
  document_stats?: {
    views: number
    downloads: number
  }[]
}

export default function AdminDocumentsPage() {
  const router = useRouter()
  const { downloadDocument, previewDocument } = useDocumentUpload()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string>('')
  const [activeTab, setActiveTab] = useState('list')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  useEffect(() => {
    // Importamos dinámicamente para evitar problemas de SSR
    const checkAuthAndFetchDocuments = async () => {
      try {
        const { validateToken, clearAuthToken } = await import('@/lib/auth-utils')
        
        const token = localStorage.getItem('auth-token')
        if (!token) {
          router.push('/login')
          return
        }
        
        // Validar el token
        const { valid, error } = validateToken(token)
        if (!valid) {
          console.error('Invalid auth token:', error)
          clearAuthToken()
          router.push('/login')
          return
        }
        
        setAuthToken(token)
        fetchDocuments(1)
      } catch (error) {
        console.error('Auth validation error:', error)
        localStorage.removeItem('auth-token')
        router.push('/login')
      }
    }
    
    checkAuthAndFetchDocuments()
  }, [router])

  const fetchDocuments = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documents?page=${pageNum}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Error al cargar documentos')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
      setPage(data.page || 1)
      setTotalPages(data.totalPages || 1)    } catch (error) {
      toast.error("No se pudieron cargar los documentos")
    } finally {
      setLoading(false)
    }
  }
  const handleUploadSuccess = (document: Document) => {
    setDocuments(prev => [document, ...prev])
    setActiveTab('list')
    toast.success("Documento subido correctamente")
  }

  const handleDownload = async (documentId: string, fileName: string) => {
    try {
      const downloadUrl = await downloadDocument(documentId)
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success(`Descargando ${fileName}`)
    } catch (error) {
      toast.error("No se pudo descargar el archivo")
    }
  }

  const handlePreview = async (documentId: string) => {
    try {
      const { url, fileName, contentType } = await previewDocument(documentId)
      
      // Abrir en nueva ventana para previsualización
      window.open(url, '_blank')
      
      toast.success(`Abriendo ${fileName}`)
    } catch (error) {
      toast.error("No se pudo abrir la vista previa")
    }
  }
  const handleDelete = async (documentId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este documento?')) {
      return
    }

    console.log('🗑️ Eliminando documento:', documentId)
    console.log('🔑 Token auth:', authToken ? 'Presente' : 'Ausente')

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📡 Respuesta del servidor:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Error del servidor:', errorData)
        throw new Error(errorData.error || 'Error al eliminar documento')
      }

      const result = await response.json()
      console.log('✅ Documento eliminado exitosamente:', result)
      
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      toast.success("El documento se ha eliminado correctamente")
    } catch (error) {
      console.error('❌ Error en handleDelete:', error)
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  const columns = [
    { key: 'title', label: 'Título' },
    { key: 'author', label: 'Autor' },
    { key: 'type', label: 'Tipo' },
    { key: 'year', label: 'Año' },
    { key: 'file_name', label: 'Archivo' },
    { key: 'views', label: 'Vistas' },
    { key: 'downloads', label: 'Descargas' },
    { key: 'featured', label: 'Destacado' },
    { key: 'actions', label: 'Acciones' }
  ]

  const documentActions = (document: Document) => (
    <div className="flex space-x-1">
      {document.file_url && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handlePreview(document.id)}
            title="Vista previa"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload(document.id, document.file_name || 'documento')}
            title="Descargar"
          >
            <Download className="h-4 w-4" />
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => router.push(`/admin/documents/${document.id}`)}
        title="Editar"
      >
        Editar
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleDelete(document.id)}
        title="Eliminar"
        className="text-red-600 hover:text-red-700"
      >
        Eliminar
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Documentos</h1>
          <p className="text-gray-600 mt-2">
            Administra la biblioteca de documentos, sube nuevos archivos y gestiona el contenido.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir Nuevo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lista de Documentos</span>
                  <Button onClick={() => setActiveTab('upload')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Documento
                  </Button>
                </CardTitle>
                <CardDescription>
                  Total de documentos: {documents.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p>Cargando documentos...</p>
                  </div>                ) : (                  <DocumentTable
                    documents={documents}
                    onDocumentDeleted={() => fetchDocuments(page)}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            <DocumentUploadForm
              authToken={authToken}
              onSuccess={handleUploadSuccess}
              onCancel={() => setActiveTab('list')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
