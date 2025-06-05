"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"
import type { Book } from "@/types/book"
import { useState, useEffect } from "react"

interface ThumbnailsCarouselProps {
  books: Book[]
  currentIndex: number
  onSlideChange: (index: number) => void
}

export function ThumbnailsCarousel({ books, currentIndex, onSlideChange }: ThumbnailsCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Calcular elementos por página basado en responsive breakpoints
  const getItemsPerPage = () => {
    // En móvil: 2 columnas × 3 filas = 6
    // En tablet: 3 columnas × 3 filas = 9
    // En desktop: 4 columnas × 3 filas = 12
    return 12 // Usamos el máximo para simplificar, pero se adapta con CSS
  }

  const itemsPerPage = getItemsPerPage()
  const totalPages = Math.ceil(books.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, books.length)
  const currentPageBooks = books.slice(startIndex, endIndex)

  useEffect(() => {
    const newPage = Math.floor(currentIndex / itemsPerPage)
    if (newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }, [currentIndex, itemsPerPage, currentPage])

  if (books.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/70">No hay libros disponibles</p>
      </div>
    )
  }

  return (
    <div className="relative py-8">
      <div className="relative mx-auto max-w-full overflow-hidden rounded-lg">
        <ul
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 py-6 min-h-[600px]"
          role="tablist"
          aria-label="Seleccionar libro destacado"
        >
          {currentPageBooks.map((book, pageIndex) => {
            const actualIndex = startIndex + pageIndex
            return (
              <li key={book.id} role="presentation" className="flex justify-center">
                <motion.button
                  onClick={() => onSlideChange(actualIndex)}
                  className={cn(
                    "relative w-32 h-48 rounded-lg overflow-hidden transition-all duration-500 ease-in-out",
                    "hover:z-10 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent",
                    actualIndex === currentIndex ? "ring-2 ring-white scale-105 z-20" : "opacity-70 hover:opacity-100",
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: actualIndex === currentIndex ? 1 : 0.7,
                    scale: actualIndex === currentIndex ? 1.05 : 1,
                    y: 0,
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { duration: 0.3, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                    delay: pageIndex * 0.1,
                  }}
                  style={{
                    minWidth: "128px",
                    maxWidth: "128px",
                    minHeight: "192px",
                    maxHeight: "192px",
                  }}
                  role="tab"
                  aria-selected={actualIndex === currentIndex}
                  aria-controls={`book-panel-${actualIndex}`}
                  aria-label={`Seleccionar ${book.title}`}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={book.coverImage || "/placeholder.svg"}
                      alt={`Miniatura de ${book.title}`}
                      fill
                      className="object-cover transition-transform duration-800"
                      sizes="128px"
                    />

                    <motion.div
                      className="absolute inset-0 bg-gradient-radial from-white/30 via-blue-400/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700"
                      initial={{ opacity: 0, scale: 1 }}
                      whileHover={{
                        opacity: 1,
                        background:
                          "radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, rgba(59,130,246,0.3) 30%, rgba(59,130,246,0.1) 60%, transparent 100%)",
                      }}
                      animate={{
                        opacity: actualIndex === currentIndex ? 0.3 : 0,
                      }}
                      transition={{
                        duration: 0.8,
                        ease: "easeInOut",
                      }}
                    />

                    <div className="absolute -inset-1 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg">
                      <div className="absolute inset-0 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.8),0_0_30px_rgba(59,130,246,0.6),0_0_45px_rgba(59,130,246,0.4)] border-2 border-blue-400/70 animate-pulse"></div>
                    </div>

                    <motion.div
                      className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs font-medium"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: actualIndex === currentIndex ? 1 : 0,
                        y: actualIndex === currentIndex ? 0 : 10,
                      }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <p className="line-clamp-2 leading-tight">
                        {book.title.length > 25 ? book.title.substring(0, 25) + "..." : book.title}
                      </p>
                    </motion.div>

                    {actualIndex === currentIndex && (
                      <motion.div
                        className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </motion.button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Sistema de paginación */}
      <div className="mt-8" role="navigation" aria-label="Paginación de libros">
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => {
                  setCurrentPage(pageIndex)
                  // Cambiar al primer elemento de la nueva página
                  const newIndex = pageIndex * itemsPerPage
                  onSlideChange(newIndex)
                }}
                className={`
            px-3 py-1 rounded-md text-sm font-medium transition-all duration-300
            ${pageIndex === currentPage ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30"}
          `}
                aria-label={`Página ${pageIndex + 1}`}
                aria-current={pageIndex === currentPage ? "page" : undefined}
              >
                {pageIndex + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
