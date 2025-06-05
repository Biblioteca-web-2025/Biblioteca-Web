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
      { value: "tecnologia", label: "Tecnología" },
      { value: "ciencia", label: "Ciencia" },
      { value: "pedagogia", label: "Pedagogía" },
      { value: "humanidad", label: "Humanidad" },
    ],
  },
  {
    name: "Subcategoría",
    options: [
      { value: "innovación", label: "Innovación" },
      { value: "sostenibilidad", label: "Sostenibilidad" },
      { value: "desarrollo", label: "Desarrollo" },
      { value: "investigación", label: "Investigación" },
    ],
  },
  {
    name: "Año",
    options: [
      { value: "2023", label: "2023" },
      { value: "2022", label: "2022" },
      { value: "2021", label: "2021" },
    ],
  },
]

export default function ProyectosPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const { documents: allDocuments, loading, error } = useDocumentsPublic({
    type: 'proyectos',
    limit: 50
  })

  const [filteredProjects, setFilteredProjects] = useState(allDocuments)

  useEffect(() => {
    setFilteredProjects(allDocuments)
  }, [allDocuments])

  useEffect(() => {
    const filtered = allDocuments.filter((doc) => {
      let passesFilters = true

      if (Object.keys(filters).length === 0) {
        return passesFilters
      }

      if (filters["Categoría"] && filters["Categoría"] !== "all") {
        const categoryMatch = doc.category.toLowerCase() === filters["Categoría"].toLowerCase()
        passesFilters = passesFilters && categoryMatch
      }

      if (filters["Subcategoría"] && filters["Subcategoría"] !== "all") {
        // Usar keywords como subcategoría
        const subcategoryMatch = doc.keywords?.toLowerCase().includes(filters["Subcategoría"].toLowerCase()) || false
        passesFilters = passesFilters && subcategoryMatch
      }

      if (filters["Año"] && filters["Año"] !== "all") {
        const yearMatch = doc.year === filters["Año"]
        passesFilters = passesFilters && yearMatch
      }

      return passesFilters
    })

    setFilteredProjects(filtered)
  }, [allDocuments, filters])

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <FeaturedBooksCarousel />

        <div className="bg-orange-50 dark:bg-orange-900/20 py-12">
          <div className="max-w-screen-xl mx-auto px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Proyectos</h1>
            <p className="text-muted-foreground max-w-3xl">
              Conoce proyectos innovadores, iniciativas de desarrollo y propuestas de investigación aplicada en el
              ámbito educativo.
            </p>
          </div>
        </div>

      

        <Footer />
      </main>
    </div>
  )
}
