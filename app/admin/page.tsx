"use client"

import { AdminHeader } from "@/components/admin-header"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DocumentTable } from "@/components/document-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useDocumentsComplete } from "@/hooks/use-documents-complete"

function DocumentTableWithPagination() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [currentFilter, setCurrentFilter] = useState("all")
  
  // Use the documents hook to get real data from database
  const { documents: dbDocuments, loading, error, total } = useDocumentsComplete({
    page: 1,
    limit: 1000 // Get all documents for local filtering
  })

  // Paginated documents for current page
  const [paginatedDocuments, setPaginatedDocuments] = useState<any[]>([])

  // When database documents change, update filtered documents
  useEffect(() => {
    if (dbDocuments && dbDocuments.length > 0) {
      if (currentFilter === "all") {
        setFilteredDocuments(dbDocuments)
      } else {
        const filtered = dbDocuments.filter((doc) => doc.type === currentFilter)
        setFilteredDocuments(filtered)
      }
    }
  }, [dbDocuments, currentFilter])

  // Escuchar cambios de filtro desde el sidebar
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const filterType = event.detail.filterType
      setCurrentFilter(filterType)
      console.log("Filtro aplicado en paginación:", filterType)

      if (dbDocuments && dbDocuments.length > 0) {
        let filtered
        if (filterType === "all") {
          filtered = dbDocuments
        } else {
          filtered = dbDocuments.filter((doc) => doc.type === filterType)
        }

        setFilteredDocuments(filtered)
        setCurrentPage(1) // Resetear a la primera página cuando se aplica un filtro
      }
    }

    window.addEventListener("filterChange", handleFilterChange as EventListener)

    return () => {
      window.removeEventListener("filterChange", handleFilterChange as EventListener)
    }
  }, [dbDocuments])

  // Calcular el total de páginas basado en documentos filtrados
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)

  // Actualizar los documentos cuando cambia la página o los documentos filtrados
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedDocuments(filteredDocuments.slice(startIndex, endIndex))
    console.log("Documentos paginados:", filteredDocuments.slice(startIndex, endIndex))
  }, [currentPage, filteredDocuments])

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <p className="text-red-500">Error al cargar documentos: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DocumentTable documents={paginatedDocuments} />

      {/* Controles de paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
          {Math.min(currentPage * itemsPerPage, filteredDocuments.length)} de {filteredDocuments.length} documentos
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPrevious} disabled={currentPage === 1}>
            Anterior
          </Button>

          <div className="flex items-center space-x-1">
            {(() => {
              const maxVisiblePages = 5
              const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
              const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
              const adjustedStartPage = Math.max(1, endPage - maxVisiblePages + 1)

              const pages = []

              // Mostrar primera página si no está en el rango
              if (adjustedStartPage > 1) {
                pages.push(
                  <Button key={1} variant="outline" size="sm" onClick={() => goToPage(1)} className="w-8 h-8">
                    1
                  </Button>,
                )
                if (adjustedStartPage > 2) {
                  pages.push(
                    <span key="ellipsis1" className="px-2">
                      ...
                    </span>,
                  )
                }
              }

              // Mostrar páginas en el rango
              for (let i = adjustedStartPage; i <= endPage; i++) {
                pages.push(
                  <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(i)}
                    className="w-8 h-8"
                  >
                    {i}
                  </Button>,
                )
              }

              // Mostrar última página si no está en el rango
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" className="px-2">
                      ...
                    </span>,
                  )
                }
                pages.push(
                  <Button
                    key={totalPages}
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    className="w-8 h-8"
                  >
                    {totalPages}
                  </Button>,
                )
              }

              return pages
            })()}
          </div>

          <Button variant="outline" size="sm" onClick={goToNext} disabled={currentPage === totalPages}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
      <AdminHeader />
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Panel de Administración
              </h1>
              <p className="text-muted-foreground mt-2">Gestiona y organiza la biblioteca digital</p>
            </div>
          </div>

          {/* Documents Table */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold">Matriz de documentos</CardTitle>
                  <CardDescription>Gestiona todos los documentos de la biblioteca</CardDescription>
                </div>
                <Link href="/admin/documents/new">
                  <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-emerald-400/30 hover:border-emerald-300/50">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nuevo documento
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <DocumentTableWithPagination />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
