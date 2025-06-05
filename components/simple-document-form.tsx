"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, X } from "lucide-react"

interface DocumentFormData {
  title: string
  author: string
  category: string
  subcategory: string
  year: string
  description: string
  keywords: string
  editorial: string
  isbn: string
  pages: number | null
  location: string
  type: string
  featured: boolean
}

interface SimpleDocumentFormProps {
  onSuccess?: (document: any) => void
  onCancel?: () => void
}

export default function SimpleDocumentForm({ onSuccess, onCancel }: SimpleDocumentFormProps) {
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    author: '',
    category: '',
    subcategory: '',
    year: new Date().getFullYear().toString(),
    description: '',
    keywords: '',
    editorial: '',
    isbn: '',
    pages: null,
    location: '',
    type: 'book',
    featured: false
  })

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const categories = [
    'Ciencias',
    'Tecnología',
    'Matemáticas',
    'Literatura',
    'Historia',
    'Arte',
    'Filosofía',
    'Educación',
    'Psicología',
    'Sociología',
    'Economía',
    'Derecho',
    'Medicina',
    'Otros'
  ]

  const documentTypes = [
    { value: 'book', label: 'Libro' },
    { value: 'article', label: 'Artículo' },
    { value: 'thesis', label: 'Tesis' },
    { value: 'project', label: 'Proyecto' },
    { value: 'report', label: 'Reporte' },
    { value: 'other', label: 'Otro' }
  ]

  const handleInputChange = (field: keyof DocumentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('El título es requerido')
      return false
    }
    if (!formData.author.trim()) {
      setError('El autor es requerido')
      return false
    }
    if (!formData.category) {
      setError('La categoría es requerida')
      return false
    }
    if (!formData.year) {
      setError('El año es requerido')
      return false
    }
    if (!formData.type) {
      setError('El tipo es requerido')
      return false
    }
    if (!file) {
      setError('Debe seleccionar un archivo')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const formDataToSend = new FormData()
      formDataToSend.append('file', file!)
      formDataToSend.append('documentData', JSON.stringify({
        ...formData,
        pages: formData.pages || null
      }))

      console.log('📤 Enviando documento:', formData.title)

      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error ${response.status}`)
      }

      console.log('✅ Documento creado:', result)
      setSuccess('Documento creado exitosamente')
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        category: '',
        subcategory: '',
        year: new Date().getFullYear().toString(),
        description: '',
        keywords: '',
        editorial: '',
        isbn: '',
        pages: null,
        location: '',
        type: 'book',
        featured: false
      })
      setFile(null)

      if (onSuccess) {
        onSuccess(result)
      }

    } catch (error) {
      console.error('❌ Error al crear documento:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Nuevo Documento
        </CardTitle>
        <CardDescription>
          Completa el formulario para agregar un nuevo documento a la biblioteca
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título del documento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange('author', e.target.value)}
                placeholder="Nombre del autor"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategoría</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
                placeholder="Subcategoría (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año *</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="Año de publicación"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editorial">Editorial</Label>
              <Input
                id="editorial"
                value={formData.editorial}
                onChange={(e) => handleInputChange('editorial', e.target.value)}
                placeholder="Editorial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Páginas</Label>
              <Input
                id="pages"
                type="number"
                value={formData.pages || ''}
                onChange={(e) => handleInputChange('pages', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Número de páginas"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción del documento"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Palabras clave</Label>
            <Input
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="Palabras clave separadas por comas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Archivo *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="file" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">
                      Seleccionar archivo
                    </span>
                    <input
                      id="file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.txt"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, Word, Excel, PowerPoint, imágenes o texto (máx. 50MB)
                </p>
              </div>
              {file && (
                <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="featured">Documento destacado</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creando...' : 'Crear Documento'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
