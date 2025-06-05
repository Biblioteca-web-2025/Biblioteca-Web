"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { FeaturedBooksCarousel } from "@/components/featured-books-carousel"
import { useDocumentsPublic } from "@/hooks/use-documents-public"
import { DocumentGrid } from "@/components/document-grid"
import { Footer } from "@/components/footer"

// Datos para los filtros
const filterCategories = [
  {
    name: "Categoría",
    options: [
      { value: "pedagogia", label: "Pedagogía" },
      { value: "ciencia", label: "Ciencia" },
      { value: "humanidad", label: "Humanidad" },
      { value: "tecnologia", label: "Tecnología" },
    ],
  },
  {
    name: "Subcategoría",
    options: [
      { value: "investigacion", label: "Investigación" },
      { value: "articulo", label: "Artículos" },
      { value: "proyecto", label: "Proyectos" },
    ],
  },
  {
    name: "Año",
    options: [
      { value: "2022", label: "2022" },
      { value: "2021", label: "2021" },
      { value: "2020", label: "2020" },
      { value: "2019", label: "2019" },
      { value: "2017", label: "2017" },
    ],
  },
]

export default function ArticulosPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { documents: allDocuments, loading, error } = useDocumentsPublic({
    type: 'articulos',
    limit: 50
  })

  const [filteredArticles, setFilteredArticles] = useState(allDocuments)

  useEffect(() => {
    setFilteredArticles(allDocuments)
  }, [allDocuments])

  // Aplicar filtros adicionales cuando cambien
  useEffect(() => {
    if (!allDocuments.length) return
    
    const filtered = allDocuments.filter((doc) => {
      // Si no hay filtros, mostrar todos los documentos
      if (Object.keys(filters).length === 0) {
        return true
      }

      let passesFilters = true

      // Filtrar por categoría
      if (filters["Categoría"] && filters["Categoría"] !== "all") {
        const categoryMatch = doc.category?.toLowerCase() === filters["Categoría"].toLowerCase()
        passesFilters = passesFilters && categoryMatch
      }

      // Filtrar por subcategoría - using keywords or other available field
      if (filters["Subcategoría"] && filters["Subcategoría"] !== "all") {
        const subcategoryMatch = doc.keywords?.toLowerCase().includes(filters["Subcategoría"].toLowerCase()) || false
        passesFilters = passesFilters && subcategoryMatch
      }

      // Filtrar por año
      if (filters["Año"] && filters["Año"] !== "all") {
        const docYear = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : ''
        const yearMatch = docYear === filters["Año"]
        passesFilters = passesFilters && yearMatch
      }

      return passesFilters
    })

    setFilteredArticles(filtered)
  }, [filters, allDocuments])

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Carrusel de libros destacados - Usando los mismos datos filtrados */}
        <FeaturedBooksCarousel />

        <div className="bg-blue-50 dark:bg-blue-900/20 py-12">
          <div className="max-w-screen-xl mx-auto px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Artículos</h1>
            <p className="text-muted-foreground max-w-3xl">
              Explora nuestra colección de artículos académicos, investigaciones y recursos educativos.
            </p>
          </div>
        </div>

        {/* Documents Grid */}
        
        <Footer />
      </main>
    </div>
  )
}
