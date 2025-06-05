"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Calendar, Download, FileText, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

interface Document {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  type: string;
  year: string;
  keywords?: string;
  pages?: number;
  editorial?: string;
  isbn?: string;
  location?: string;
  file_url?: string;
  cover_image_url?: string;
  file_size?: number;
  file_type?: string;
  upload_date: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/documents-public?id=${params.id}`)
        
        if (!response.ok) {
          throw new Error('Documento no encontrado')
        }

        const data = await response.json()
        
        if (data.documents && data.documents.length > 0) {
          setDocument(data.documents[0])
        } else {
          throw new Error('Documento no encontrado')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el documento')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [params.id])

  const handleDownload = async () => {
    if (!document?.file_url) return;
    
    try {
      // Si la URL ya es pública (comienza con https://), usar directamente
      if (document.file_url.startsWith('https://')) {
        window.open(document.file_url, '_blank');
      } else {
        // Caso alternativo: usar la API de download
        window.open(`/api/download?id=${document.id}`, '_blank');
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar el documento');
    }
  };

  const handlePreview = async () => {
    if (!document?.file_url) return;
    
    try {
      // Si la URL ya es pública (comienza con https://), usar directamente
      if (document.file_url.startsWith('https://')) {
        // Para PDF podemos abrir en el navegador
        if (document.file_url.toLowerCase().endsWith('.pdf') || document.file_type === 'application/pdf') {
          window.open(document.file_url, '_blank');
        } else {
          // Para otros tipos, intentar descargar
          window.open(`/api/download?id=${document.id}&preview=true`, '_blank');
        }
      } else {
        // Caso alternativo: usar la API de preview
        window.open(`/api/download?id=${document.id}&preview=true`, '_blank');
      }
    } catch (error) {
      console.error('Error al previsualizar:', error);
      alert('Error al previsualizar el documento');
    }
  };

  const handleCopyLink = async () => {
    try {
      const currentUrl = window.location.href
      await navigator.clipboard.writeText(currentUrl)
      alert("Enlace copiado al portapapeles")
    } catch (error) {
      console.error('Error al copiar enlace:', error)
      alert("Error al copiar el enlace")
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto pt-24 px-4 pb-4 md:pt-32 md:px-6 md:pb-6">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="group">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Volver a la biblioteca
              </Button>
            </Link>
          </div>
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <p>Cargando documento...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Error state
  if (error || !document) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto pt-24 px-4 pb-4 md:pt-32 md:px-6 md:pb-6">
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="group">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Volver a la biblioteca
              </Button>
            </Link>
          </div>

          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Documento no encontrado</h1>
              <p className="text-muted-foreground mb-6">
                {error || `El documento con ID "${params.id}" no existe o ha sido eliminado.`}
              </p>
              <Link href="/">
                <Button>Volver a la biblioteca</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto pt-24 px-4 pb-4 md:pt-32 md:px-6 md:pb-6">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="group">
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Volver a la biblioteca
            </Button>
          </Link>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="bg-muted/30 p-6 md:p-8 flex flex-col">
                  <div className="relative w-full max-w-xs mx-auto aspect-[3/4] mb-6 rounded-lg overflow-hidden shadow-lg">
                    <Image
                      src={document.cover_image_url || "/placeholder.svg"}
                      alt={document.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="space-y-3 mt-auto">
                    <Button 
                      className="w-full" 
                      size="lg" 
                      onClick={handlePreview}
                      disabled={!document.file_url}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Ver documento
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleDownload}
                      disabled={!document.file_url}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Descargar {document.file_type?.includes('pdf') ? 'PDF' : 'Archivo'}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2 p-6 md:p-8 space-y-6">
                  <div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-4">{document.title}</h1>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                          {document.category}
                        </span>
                        {document.type && (
                          <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary-foreground font-medium">
                            {document.type}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{document.author}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{document.year}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Documento {document.type}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-4">Resumen</h2>
                    <p className="text-muted-foreground leading-relaxed">{document.description}</p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3">Compartir</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        Copiar enlace
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
