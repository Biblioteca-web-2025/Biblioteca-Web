"use client"

import React, { use } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { AdminHeader } from "@/components/admin-header"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Upload, Calendar } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"

// Helper function to get auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClientComponentClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('No se encontró sesión válida en Supabase');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Error obteniendo token de Supabase:', error);
    return null;
  }
}

// Importar el componente de verificación de autenticación dinámicamente
const AuthStatusCheck = dynamic(() => import('@/components/auth-status-check'), {
  ssr: false,
  loading: () => <div className="bg-slate-100 p-4 rounded-md mb-4">Cargando comprobación de autenticación...</div>
})

export default function DocumentEditPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise using React.use() as required by Next.js
  const resolvedParams = React.use(params);
  const paramId = resolvedParams.id || 'new';
  
  const isNew = paramId === "new"
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    workType: "",
    knowledgeField: "",
    keywords: "",
    folder: "",
    publicationDate: "",
    pages: "",
    editorial: "",
    isbn: "",
    location: "",
    summary: "",
  })

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string>("")
  const [authToken, setAuthToken] = useState<string>("")

  // Obtener token de autenticación al cargar
  useEffect(() => {
    // Skip if we're on the server
    if (typeof window === 'undefined') {
      return;
    }
    
    const initializeAuth = async () => {
      try {
        const token = await getAuthToken();
        
        if (!token) {
          console.warn('No se encontró token de autenticación');
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
          return;
        }
        
        setAuthToken(token);
        console.log('Token autenticado correctamente');
      } catch (error) {
        console.error('Error al obtener token:', error);
        router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      }
    };
    
    initializeAuth();
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type === "application/pdf") {
        setPdfFile(file)
        setPdfFileName(file.name)
      } else {
        toast.error("Por favor selecciona un archivo PDF válido")
        const input = document.getElementById("pdf-upload") as HTMLInputElement
        if (input) input.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validaciones básicas
    if (!formData.title.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    
    if (!formData.author.trim()) {
      toast.error("El autor es obligatorio")
      return
    }
    
    if (!formData.summary.trim()) {
      toast.error("El resumen es obligatorio")
      return
    }
    
    if (!pdfFile) {
      toast.error("Debe seleccionar un archivo PDF")
      return
    }

    setLoading(true)
    const toastId = toast.loading("Guardando documento...")

    try {
      // Verificar y actualizar token si es necesario
      const { getAuthToken } = await import('@/lib/auth-utils');
      const token = getAuthToken() || authToken;
      
      if (!token) {
        toast.error("No hay sesión de administrador válida", { id: toastId });
        router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
        return;
      }
      
      // Crear FormData para enviar archivos
      const uploadData = new FormData()
      
      // Crear objeto con datos del documento
      const documentData = {
        title: formData.title,
        author: formData.author,
        description: formData.summary,
        type: formData.workType || 'otros',
        category: formData.knowledgeField || 'otros',
        year: new Date(formData.publicationDate || Date.now()).getFullYear().toString(),
        keywords: formData.keywords,
        pages: formData.pages ? parseInt(formData.pages) : undefined,
        editorial: formData.editorial,
        isbn: formData.isbn,
        location: formData.location,
        featured: false
      }
      
      console.log('Enviando documento:', documentData.title);
      
      // Agregar datos como JSON string (como espera la API)
      uploadData.append('documentData', JSON.stringify(documentData))
      
      // Agregar archivo principal (como espera la API)
      uploadData.append('file', pdfFile)
      
      // Si hay imagen de portada, agregarla también
      if (coverImage) {
        uploadData.append('coverImage', coverImage)
      }
      
      // Enviar a la API con autenticación
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (!response.ok) {
        console.error('Error de respuesta API:', response.status, result);
        
        if (response.status === 401 || response.status === 403) {
          toast.error("Sesión expirada o inválida. Inicie sesión nuevamente.", { id: toastId });
          
          // Importar función para limpiar tokens
          const { clearAuthToken } = await import('@/lib/auth-utils');
          clearAuthToken();
          
          router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
          return;
        }
        throw new Error(result.error || 'Error al guardar el documento')
      }

      toast.success(`Documento "${formData.title}" ${isNew ? "creado" : "actualizado"} exitosamente`, {
        id: toastId,
      })
      
      // Redireccionar al panel de administración
      router.push('/admin')
      
    } catch (error) {
      console.error('Error al guardar documento:', error)
      toast.error(
        error instanceof Error ? error.message : 'Error inesperado al guardar el documento',
        { id: toastId }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {/* Componente de verificación de estado de autenticación */}
          <AuthStatusCheck />
          
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{isNew ? "Nuevo documento" : "Editar documento"}</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-800 dark:via-blue-900/30 dark:to-indigo-900/50 relative overflow-hidden">
                {/* Textura de fondo */}
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(16,185,129,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(13,148,136,0.1)_35%,rgba(13,148,136,0.1)_65%,transparent_65%)] bg-[length:40px_40px]"></div>
                </div>

                {/* Contenido existente con z-index relativo */}
                <div className="relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          placeholder="Ingrese el título del documento"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          required
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="author">Autor (es/as)</Label>
                        <Input
                          id="author"
                          placeholder="Nombre del autor (usar coma para separar autores)"
                          value={formData.author}
                          onChange={(e) => handleInputChange("author", e.target.value)}
                          required
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="work-type">Tipo de Obra</Label>
                        <Select
                          value={formData.workType}
                          onValueChange={(value) => handleInputChange("workType", value)}
                        >
                          <SelectTrigger className="bg-gray-50 text-gray-900">
                            <SelectValue placeholder="Seleccionar tipo de obra" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="articulos">Artículos</SelectItem>
                            <SelectItem value="proyectos">Proyectos</SelectItem>
                            <SelectItem value="trabajo-de-grado">Trabajo de grado</SelectItem>
                            <SelectItem value="fichas">Fichas</SelectItem>
                            <SelectItem value="libros">Libros</SelectItem>
                            <SelectItem value="otras-publicaciones">Otras publicaciones</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="knowledge-field">Campo de conocimiento</Label>
                        <Select
                          value={formData.knowledgeField}
                          onValueChange={(value) => handleInputChange("knowledgeField", value)}
                        >
                          <SelectTrigger className="bg-gray-50 text-gray-900">
                            <SelectValue placeholder="Seleccionar campo de conocimiento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pedagogia">Pedagogía</SelectItem>
                            <SelectItem value="psicologia-educativa">Psicología Educativa</SelectItem>
                            <SelectItem value="didactica">Didáctica</SelectItem>
                            <SelectItem value="curriculum">Currículum</SelectItem>
                            <SelectItem value="evaluacion-educativa">Evaluación Educativa</SelectItem>
                            <SelectItem value="tecnologia-educativa">Tecnología Educativa</SelectItem>
                            <SelectItem value="educacion-especial">Educación Especial</SelectItem>
                            <SelectItem value="educacion-inicial">Educación Inicial</SelectItem>
                            <SelectItem value="educacion-basica">Educación Básica</SelectItem>
                            <SelectItem value="educacion-media">Educacion Media</SelectItem>
                            <SelectItem value="educacion-superior">Educación Superior</SelectItem>
                            <SelectItem value="formacion-docente">Formación Docente</SelectItem>
                            <SelectItem value="gestion-educativa">Gestión Educativa</SelectItem>
                            <SelectItem value="politicas-educativas">Políticas Educativas</SelectItem>
                            <SelectItem value="investigacion-educativa">Investigación Educativa</SelectItem>
                            <SelectItem value="matematicas">Matemáticas</SelectItem>
                            <SelectItem value="fisica">Física</SelectItem>
                            <SelectItem value="quimica">Química</SelectItem>
                            <SelectItem value="biologia">Biología</SelectItem>
                            <SelectItem value="ciencias-naturales">Ciencias Naturales</SelectItem>
                            <SelectItem value="ciencias-sociales">Ciencias Sociales</SelectItem>
                            <SelectItem value="historia">Historia</SelectItem>
                            <SelectItem value="geografia">Geografía</SelectItem>
                            <SelectItem value="filosofia">Filosofía</SelectItem>
                            <SelectItem value="literatura">Literatura</SelectItem>
                            <SelectItem value="linguistica">Lingüística</SelectItem>
                            <SelectItem value="idiomas">Idiomas</SelectItem>
                            <SelectItem value="arte">Arte</SelectItem>
                            <SelectItem value="musica">Música</SelectItem>
                            <SelectItem value="educacion-fisica">Educación Física</SelectItem>
                            <SelectItem value="informatica">Informática</SelectItem>
                            <SelectItem value="ingenieria">Ingeniería</SelectItem>
                            <SelectItem value="arquitectura">Arquitectura</SelectItem>
                            <SelectItem value="medicina">Medicina</SelectItem>
                            <SelectItem value="enfermeria">Enfermería</SelectItem>
                            <SelectItem value="psicologia">Psicología</SelectItem>
                            <SelectItem value="sociologia">Sociología</SelectItem>
                            <SelectItem value="antropologia">Antropología</SelectItem>
                            <SelectItem value="comunicacion">Comunicación</SelectItem>
                            <SelectItem value="administracion">Administración</SelectItem>
                            <SelectItem value="economia">Economía</SelectItem>
                            <SelectItem value="derecho">Derecho</SelectItem>
                            <SelectItem value="trabajo-social">Trabajo Social</SelectItem>
                            <SelectItem value="medio-ambiente">Medio Ambiente</SelectItem>
                            <SelectItem value="desarrollo-sostenible">Desarrollo Sostenible</SelectItem>
                            <SelectItem value="innovacion">Innovación</SelectItem>
                            <SelectItem value="emprendimiento">Emprendimiento</SelectItem>
                            <SelectItem value="multidisciplinario">Multidisciplinario</SelectItem>
                            <SelectItem value="otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="keywords">Palabras claves</Label>
                        <Textarea
                          id="keywords"
                          placeholder="Ingrese palabras clave separadas por comas"
                          className="min-h-20 bg-gray-50 text-gray-900"
                          value={formData.keywords}
                          onChange={(e) => handleInputChange("keywords", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="publication-date">Fecha de publicación</Label>
                        <div className="relative">
                          <Input
                            id="publication-date"
                            type="date"
                            required
                            className="pr-10 bg-gray-50 text-gray-900 [&::-webkit-calendar-picker-indicator]:opacity-100"
                            value={formData.publicationDate}
                            onChange={(e) => handleInputChange("publicationDate", e.target.value)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Calendar className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pages">Páginas</Label>
                        <Input
                          id="pages"
                          placeholder="Número de páginas"
                          type="number"
                          value={formData.pages}
                          onChange={(e) => handleInputChange("pages", e.target.value)}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editorial">Editorial/Fuente</Label>
                        <Input
                          id="editorial"
                          placeholder="Editorial o fuente de publicación"
                          value={formData.editorial}
                          onChange={(e) => handleInputChange("editorial", e.target.value)}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="isbn">ISBN/ISSN</Label>
                        <Input
                          id="isbn"
                          placeholder="Código ISBN o ISSN"
                          value={formData.isbn}
                          onChange={(e) => handleInputChange("isbn", e.target.value)}
                          className="bg-gray-50 text-gray-900"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicación</Label>
                        <Select
                          value={formData.location}
                          onValueChange={(value) => handleInputChange("location", value)}
                        >
                          <SelectTrigger id="location" className="bg-gray-50 text-gray-900">
                            <SelectValue placeholder="Seleccionar tipo de ubicación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fisico">Físico</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="summary">Resumen</Label>
                        <Textarea
                          id="summary"
                          placeholder="Resumen del contenido del documento"
                          className="min-h-32 bg-gray-50 text-gray-900"
                          required
                          value={formData.summary}
                          onChange={(e) => handleInputChange("summary", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sección de archivos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                    <div className="space-y-2">
                      <Label>Portada</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                        {coverImagePreview ? (
                          <div className="relative w-full h-48">
                            <img
                              src={coverImagePreview || "/placeholder.svg"}
                              alt="Vista previa de portada"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setCoverImage(null)
                                setCoverImagePreview("")
                                const input = document.getElementById("cover-upload") as HTMLInputElement
                                if (input) input.value = ""
                              }}
                              type="button"
                            >
                              Eliminar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center">
                              Arrastra una imagen o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, WebP (máx. 5MB)</p>
                          </>
                        )}
                        <Input
                          type="file"
                          className="hidden"
                          id="cover-upload"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("cover-upload")?.click()}
                          type="button"
                        >
                          {coverImagePreview ? "Cambiar imagen" : "Seleccionar imagen"}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Documento PDF</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 min-h-[200px]">
                        {pdfFile ? (
                          <div className="w-full text-center">
                            <div className="flex items-center justify-center gap-2 mb-4">
                              <svg className="h-12 w-12 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-2">{pdfFileName}</p>
                            <p className="text-xs text-muted-foreground mb-4">
                              Tamaño: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setPdfFile(null)
                                setPdfFileName("")
                                const input = document.getElementById("pdf-upload") as HTMLInputElement
                                if (input) input.value = ""
                              }}
                              type="button"
                            >
                              Eliminar PDF
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground text-center">
                              Arrastra un PDF o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-muted-foreground">Formato: PDF (máx. 50MB)</p>
                          </>
                        )}
                        <Input
                          type="file"
                          className="hidden"
                          id="pdf-upload"
                          accept=".pdf"
                          onChange={handlePdfFileChange}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("pdf-upload")?.click()}
                          type="button"
                        >
                          {pdfFile ? "Cambiar PDF" : "Seleccionar PDF"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-6 border-t">
                    <Link href="/admin">
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Guardando..." : "Guardar documento"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </main>
      </div>
    </div>
  )
}
