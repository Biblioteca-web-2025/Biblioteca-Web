"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { FeaturedBooksCarousel } from "@/components/featured-books-carousel"
import { GenreFilter } from "@/components/genre-filter"
import { Footer } from "@/components/footer"

// Datos para los filtros
const filterCategories = [
  {
    name: "Categoría",
    options: [
      { value: "pedagogia", label: "Pedagogía" },
      { value: "humanidad", label: "Humanidad" },
      { value: "ciencia", label: "Ciencia" },
      { value: "tecnologia", label: "Tecnología" },
      { value: "arte", label: "Arte" },
    ],
  },
  {
    name: "Subcategoría",
    options: [
      { value: "investigacion", label: "Investigación" },
      { value: "tesis", label: "Tesis" },
      { value: "articulo", label: "Artículos" },
      { value: "proyecto", label: "Proyectos" },
      { value: "libro", label: "Libros" },
    ],
  },
  {
    name: "Año",
    options: [
      { value: "2023", label: "2023" },
      { value: "2022", label: "2022" },
      { value: "2021", label: "2021" },
      { value: "2020", label: "2020" },
      { value: "2019", label: "2019" },
    ],
  },
]

export default function Home() {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [activeGenre, setActiveGenre] = useState("inicio")

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    // Removido console.log para evitar logs innecesarios
  }

  const handleGenreChange = (genre: string) => {
    setActiveGenre(genre)
    // Aquí puedes agregar lógica adicional para filtrar según el género
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Featured Books Carousel */}
        <FeaturedBooksCarousel />

        {/* Genre Filter */}
        <GenreFilter onFilterChange={handleGenreChange} activeGenre={activeGenre} />

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="max-w-screen-xl mx-auto px-8 md:px-12">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">¿Por qué usar nuestra biblioteca?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ofrecemos una experiencia única para acceder a recursos educativos de calidad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Documentos completos</h3>
                <p className="text-muted-foreground">
                  Accede a documentos completos en formato PDF, listos para descargar o consultar en línea.
                </p>
              </div>

              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Acceso inmediato</h3>
                <p className="text-muted-foreground">
                  Sin esperas ni complicaciones, accede a todos los recursos de forma inmediata.
                </p>
              </div>

              <div className="bg-background p-6 rounded-lg shadow-sm border border-border/50 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Búsqueda avanzada</h3>
                <p className="text-muted-foreground">
                  Encuentra exactamente lo que necesitas con nuestro sistema de filtrado y búsqueda.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  )
}
