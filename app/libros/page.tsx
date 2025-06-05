"use client"

import { Header } from "@/components/header"
import { FeaturedBooksCarousel } from "@/components/featured-books-carousel"
import { useDocumentsComplete } from "@/hooks/use-documents-complete"
import { DocumentGrid } from "@/components/document-grid"
import { Footer } from "@/components/footer"

export default function LibrosPage() {
  const { documents, loading, error } = useDocumentsComplete({
    type: 'libros',
    limit: 50
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <FeaturedBooksCarousel />

        <div className="bg-green-50 dark:bg-green-900/20 py-12">
          <div className="max-w-screen-xl mx-auto px-8 md:px-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Libros</h1>
            <p className="text-muted-foreground max-w-3xl">
              Explora nuestra colección de libros académicos, obras clásicas y textos especializados en educación.
            </p>
          </div>
        </div>

       

        <Footer />
      </main>
    </div>
  )
}
