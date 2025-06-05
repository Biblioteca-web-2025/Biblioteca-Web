"use client"

import { useMemo } from "react"
import { useDynamicBackground } from "@/hooks/use-dynamic-background"
import { useFeaturedCarousel } from "@/hooks/use-featured-carousel"
import { DynamicBackground } from "@/components/carousel/dynamic-background"
import { BookCover } from "@/components/carousel/book-cover"
import { BookInfo } from "@/components/carousel/book-info"
import { ThumbnailsCarousel } from "@/components/carousel/thumbnails-carousel"
import { NavigationControls } from "@/components/carousel/navigation-controls"
import type { CarouselProps } from "@/types/book"

/**
 * Componente de carrusel de libros destacados con navegación automática y manual
 * Implementa mejores prácticas de accesibilidad y rendimiento
 */
export function FeaturedBooksCarousel(props: CarouselProps = {}) {
  const {
    currentIndex,
    isAutoPlaying,
    displayBooks,
    displayTitle,
    loading,
    error,
    goToNext,
    goToPrevious,
    goToSlide,
    toggleAutoPlay,
  } = useFeaturedCarousel(props)

  // Memorizar imágenes para el fondo dinámico
  const images = useMemo(() => displayBooks.map((book) => book.coverImage), [displayBooks])

  const { backgroundImage, dominantColor } = useDynamicBackground({
    images,
    currentIndex,
  })

  // Mostrar estado de carga
  if (loading) {
    return (
      <section className="relative min-h-[600px] overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4">Cargando documentos destacados...</p>
        </div>
      </section>
    )
  }

  // Mostrar mensaje de error
  if (error) {
    return (
      <section className="relative min-h-[600px] overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Error al cargar documentos</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </section>
    )
  }

  // Validación: mostrar mensaje si no hay libros
  if (displayBooks.length === 0) {
    return (
      <section className="relative min-h-[600px] overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">No hay documentos destacados disponibles</h2>
          <p className="text-gray-300">Por favor, intenta más tarde o verifica los filtros aplicados.</p>
        </div>
      </section>
    )
  }

  const currentBook = displayBooks[currentIndex]

  return (
    <section
      className="relative min-h-[600px] overflow-hidden"
      role="region"
      aria-label="Carrusel de documentos destacados"
    >
      {/* Fondo dinámico */}
      <DynamicBackground backgroundImage={backgroundImage} dominantColor={dominantColor} currentIndex={currentIndex} />

      {/* Contenido principal */}
      <div className="relative z-10 max-w-screen-xl mx-auto px-8 md:px-12 pt-40 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[400px]">
          {/* Portada del libro */}
          <BookCover book={currentBook} currentIndex={currentIndex} />

          {/* Información del libro */}
          <BookInfo book={currentBook} currentIndex={currentIndex} />
        </div>

        {/* Navegación del carrusel */}
        <div className="mt-16">
          <NavigationControls
            title={displayTitle}
            onPrevious={goToPrevious}
            onNext={goToNext}
            canGoPrevious={displayBooks.length > 1}
            canGoNext={displayBooks.length > 1}
          />

          {/* Carrusel de miniaturas */}
          <ThumbnailsCarousel books={displayBooks} currentIndex={currentIndex} onSlideChange={goToSlide} />
        </div>
      </div>
    </section>
  )
}
