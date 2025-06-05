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
      { value: "tecnologia", label: "Tecnología" },
      { value: "humanidad", label: "Humanidad" },
    ],
  },
  {
    name: "Universidad",
    options: [
      { value: "Universidad Internacional de La Rioja", label: "Universidad Internacional de La Rioja" },
      { value: "Universidad Nacional", label: "Universidad Nacional" },
      { value: "Universidad Pedagógica Nacional", label: "Universidad Pedagógica Nacional" },
      { value: "Universidad de los Andes", label: "Universidad de los Andes" },
    ],
  },
  {
    name: "Año",
    options: [
      { value: "2022", label: "2022" },
      { value: "2020", label: "2020" },
      { value: "2019", label: "2019" },
      { value: "2017", label: "2017" },
    ],
  },
]

export default function TrabajoDeGradoPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const { documents: allDocuments, loading, error } = useDocumentsPublic({
    type: 'trabajo-de-grado',
    limit: 50
  })

  const [filteredTheses, setFilteredTheses] = useState(allDocuments)

  useEffect(() => {
    setFilteredTheses(allDocuments)
  }, [allDocuments])

  // Aplicar filtros adicionales cuando cambien
  useEffect(() => {
    if (!allDocuments.length) return
    
    const filtered = allDocuments.filter((doc) => {
      let passesFilters = true

      // Si no hay filtros ni búsqueda adicionales, mostrar todos
      if (Object.keys(filters).length === 0 && !searchQuery) {
        return passesFilters
      }

      // Filtrar por categoría
      if (filters["Categoría"] && filters["Categoría"] !== "all") {
        const categoryMatch = doc.category?.toLowerCase() === filters["Categoría"].toLowerCase()
        passesFilters = passesFilters && categoryMatch
      }

      // Filtrar por universidad (usando location field)
      if (filters["Universidad"] && filters["Universidad"] !== "all") {
        const universityMatch = doc.location?.toLowerCase().includes(filters["Universidad"].toLowerCase()) || false
        passesFilters = passesFilters && universityMatch
      }

      // Filtrar por año
      if (filters["Año"] && filters["Año"] !== "all") {
        const docYear = doc.created_at ? new Date(doc.created_at).getFullYear().toString() : ''
        const yearMatch = docYear === filters["Año"]
        passesFilters = passesFilters && yearMatch
      }

      // Filtrar por búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const searchMatch = doc.title.toLowerCase().includes(query) || doc.author.toLowerCase().includes(query)
        passesFilters = passesFilters && searchMatch
      }

      return passesFilters
    })

    setFilteredTheses(filtered)
  }, [filters, searchQuery, allDocuments])

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  // Manejar cambios en la búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Carrusel de libros destacados - Usando los mismos datos filtrados */}
        <FeaturedBooksCarousel />

        <div className="bg-blue-50 dark:bg-blue-900/20 py-12">
          <div className="container mx-auto px-6 md:px-8 max-w-6xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Trabajos de Grado</h1>
            <p className="text-muted-foreground max-w-3xl">
              Explora nuestra colección de tesis y trabajos de grado de diferentes universidades e instituciones
              educativas.
            </p>
          </div>
        </div>

      

        <Footer />
      </main>
    </div>
  )
}
