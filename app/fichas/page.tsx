"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { FeaturedBooksCarousel } from "@/components/featured-books-carousel"
import { documents } from "@/data/documents"
import { Footer } from "@/components/footer"



export default function FichasPage() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState("todos")
  const [filteredCards, setFilteredCards] = useState<typeof documents>([])

  // Filtrar los documentos de tipo "fichas" al cargar
  useEffect(() => {
    // Obtener todos los documentos de tipo "fichas"
    const fichasDocuments = documents.filter((doc) => doc.type === "fichas")
    setFilteredCards(fichasDocuments)
  }, [])

  // Aplicar filtros adicionales cuando cambien
  useEffect(() => {
    // Siempre filtramos por tipo "fichas"
    const filtered = documents.filter((doc) => {
      // Filtro base por tipo de documento
      let passesFilters = doc.type === "fichas"

      // Si no hay filtros adicionales, devolver con el filtro base
      if (Object.keys(filters).length === 0) {
        return passesFilters
      }

      // Filtrar por categoría
      if (filters["Categoría"] && filters["Categoría"] !== "all") {
        const categoryMatch = doc.category === filters["Categoría"]
        passesFilters = passesFilters && categoryMatch
      }

      // Filtrar por subcategoría
      if (filters["Subcategoría"] && filters["Subcategoría"] !== "all") {
        const subcategoryMatch = doc.subcategory === filters["Subcategoría"]
        passesFilters = passesFilters && subcategoryMatch
      }

      // Filtrar por año
      if (filters["Año"] && filters["Año"] !== "all") {
        const yearMatch = doc.year === filters["Año"]
        passesFilters = passesFilters && yearMatch
      }

      return passesFilters
    })

    setFilteredCards(filtered)
  }, [filters])

  // Manejar cambios en los filtros
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
  }

  // Manejar cambios en las pestañas
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === "todos") {
      setFilters({})
    } else {
      setFilters({ ...filters, Categoría: tab })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Carrusel de libros destacados - Usando los mismos datos filtrados */}
        <FeaturedBooksCarousel />

        <div className="bg-blue-50 dark:bg-blue-900/20 py-12">
          <div className="container mx-auto px-6 md:px-8 max-w-6xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Fichas</h1>
            <p className="text-muted-foreground max-w-3xl">
              Consulta nuestras fichas bibliográficas para obtener información resumida de los documentos disponibles en
              la biblioteca.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  )
}
