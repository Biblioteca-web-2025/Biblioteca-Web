"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function ViewDocumentPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)

  // Simulación de carga del PDF
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <header className="bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/documents/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <h1 className="font-semibold truncate">Visualizador de PDF</h1>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Descargar
        </Button>
      </header>

      <main className="flex-1 p-4 flex items-center justify-center">
        {loading ? (
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4">Cargando documento...</p>
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[80vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Aquí se mostraría el visor de PDF integrado.</p>
              <p className="text-sm text-muted-foreground">
                Para una implementación completa, se utilizaría una biblioteca como react-pdf o pdfjs-dist.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
