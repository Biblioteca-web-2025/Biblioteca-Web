"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useDocumentUpload } from '@/hooks/use-document-upload'

interface DocumentUploadFormProps {
  authToken: string
  onSuccess?: (document: any) => void
  onCancel?: () => void
}

const DOCUMENT_TYPES = [
  { value: 'libro', label: 'Libro' },
  { value: 'articulo', label: 'Artículo' },
  { value: 'trabajo-grado', label: 'Trabajo de Grado' },
  { value: 'ficha', label: 'Ficha Técnica' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'publicacion', label: 'Otra Publicación' }
]

const CATEGORIES = [
  { value: 'educacion', label: 'Educación' },
  { value: 'fisica', label: 'Física' },
  { value: 'matematicas', label: 'Matemáticas' },
  { value: 'investigacion', label: 'Investigación' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'metodologia', label: 'Metodología' }
]

export default function DocumentUploadForm({ 
  authToken, 
  onSuccess, 
  onCancel 
}: DocumentUploadFormProps) {
  const router = useRouter()
  const { isUploading, uploadProgress, uploadDocument } = useDocumentUpload()

  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    year: new Date().getFullYear().toString(),
    type: '',
    category: '',
    keywords: '',
    featured: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'El título es requerido'
    if (!formData.author.trim()) newErrors.author = 'El autor es requerido'
    if (!formData.year.trim()) newErrors.year = 'El año es requerido'
    if (!formData.type) newErrors.type = 'El tipo de documento es requerido'
    if (!file) newErrors.file = 'Debe seleccionar un archivo'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
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
        'text/plain'
      ]

      if (!allowedTypes.includes(selectedFile.type)) {
        setErrors(prev => ({
          ...prev,
          file: 'Tipo de archivo no permitido. Solo se permiten PDF, documentos de Office, imágenes y archivos de texto.'
        }))
        return
      }

      // Validar tamaño (máximo 50MB)
      const maxSize = 50 * 1024 * 1024
      if (selectedFile.size > maxSize) {
        setErrors(prev => ({
          ...prev,
          file: 'El archivo es demasiado grande. El tamaño máximo es 50MB.'
        }))
        return
      }

      setFile(selectedFile)
      setErrors(prev => ({ ...prev, file: '' }))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificamos que tengamos el token antes de intentar la subida
    if (!authToken) {
      toast.error('Su sesión ha expirado, por favor inicie sesión nuevamente')
      router.push('/login')
      return
    }

    if (!validateForm() || !file) {
      toast.error('Por favor, complete todos los campos requeridos')
      return
    }
    
    const loadingToast = toast.loading('Subiendo documento, espere por favor...')
    
    try {
      console.log('🔄 Iniciando subida de documento con token:', authToken.substring(0, 15) + '...')
      const result = await uploadDocument(file, formData, authToken)
      
      toast.success(`Documento "${result.title}" subido exitosamente`, {
        id: loadingToast,
        duration: 5000
      })

      if (onSuccess) {
        onSuccess(result)
      } else {
        router.push('/admin/documents')
      }

    } catch (error) {
      console.error('💥 Error en handleSubmit:', error)
      toast.error(error instanceof Error ? error.message : 'Error desconocido al subir documento')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Nuevo Documento
        </CardTitle>
        <CardDescription>
          Complete el formulario y seleccione un archivo para subir a la biblioteca.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Información del documento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título del documento"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Nombre del autor"
                className={errors.author ? 'border-red-500' : ''}
              />
              {errors.author && <p className="text-sm text-red-500">{errors.author}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año *</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                className={errors.year ? 'border-red-500' : ''}
              />
              {errors.year && <p className="text-sm text-red-500">{errors.year}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Documento *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Palabras Clave</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                placeholder="Separadas por comas"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del documento"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: !!checked }))}
            />
            <Label htmlFor="featured">Documento destacado</Label>
          </div>

          {/* Upload de archivo */}
          <div className="space-y-2">
            <Label>Archivo del Documento *</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
              } ${errors.file ? 'border-red-500' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFile(null)}
                    size="sm"
                  >
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <p>Arrastra un archivo aquí o</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                  <p className="text-xs text-gray-500">
                    PDF, Word, Excel, PowerPoint, imágenes o texto (máx. 50MB)
                  </p>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt"
              />
            </div>
            {errors.file && <p className="text-sm text-red-500">{errors.file}</p>}
          </div>

          {/* Progress bar durante upload */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subiendo documento...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isUploading}>
            {isUploading ? 'Subiendo...' : 'Subir Documento'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
