"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { usePathname } from "next/navigation"
import type { CarouselProps, UseCarouselReturn, Book } from "@/types/book"
import { getFilteredBooks, getAutoTitle } from "@/data/featured-books"

export function useFeaturedCarousel({ filterBy, filterValue, title, books }: CarouselProps): UseCarouselReturn {
  const pathname = usePathname()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [displayBooks, setDisplayBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cargar libros destacados
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true)
        const filteredBooks = await getFilteredBooks(pathname, books)
        setDisplayBooks(filteredBooks)
      } catch (err) {
        console.error("Error loading featured books:", err)
        setError("Error al cargar los documentos destacados")
        setDisplayBooks([])
      } finally {
        setLoading(false)
      }
    }

    loadBooks()
  }, [pathname, books])

  // Memorizar título
  const displayTitle = useMemo(() => {
    return getAutoTitle(pathname, title)
  }, [pathname, title])

  // Funciones de navegación memorizadas
  const goToNext = useCallback(() => {
    if (displayBooks.length === 0) return
    setCurrentIndex((prev) => (prev + 1) % displayBooks.length)
  }, [displayBooks.length])

  const goToPrevious = useCallback(() => {
    if (displayBooks.length === 0) return
    setCurrentIndex((prev) => (prev - 1 + displayBooks.length) % displayBooks.length)
  }, [displayBooks.length])

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < displayBooks.length) {
        setCurrentIndex(index)
      }
    },
    [displayBooks.length],
  )

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || displayBooks.length <= 1) return

    const interval = setInterval(goToNext, 10000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, goToNext, displayBooks.length])

  // Reset index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= displayBooks.length && displayBooks.length > 0) {
      setCurrentIndex(0)
    }
  }, [currentIndex, displayBooks.length])

  return {
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
  }
}
