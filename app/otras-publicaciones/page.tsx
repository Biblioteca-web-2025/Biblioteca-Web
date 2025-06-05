"use client"
import { Header } from "@/components/header"
import { FeaturedBooksCarousel } from "@/components/featured-books-carousel"
import { useDocumentsPublic } from "@/hooks/use-documents-public"
import { DocumentGrid } from "@/components/document-grid"
import { Footer } from "@/components/footer"

export default function OtrasPublicacionesPage() {
  const { documents, loading, error } = useDocumentsPublic({
    type: 'otras-publicaciones',
    limit: 50
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <FeaturedBooksCarousel />

        <div className="bg-purple-50 dark:bg-purple-900/20 py-12">
          <div className="max-w-screen-xl mx-auto px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Otras Publicaciones</h1>
            <p className="text-muted-foreground max-w-3xl">
              Descubre revistas, boletines, memorias de eventos y otros tipos de publicaciones académicas
              especializadas.
            </p>
          </div>
        </div>

        

        <Footer />
      </main>
    </div>
  )
}
