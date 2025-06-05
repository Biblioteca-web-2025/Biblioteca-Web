"use client"

import { useState, useEffect, useCallback } from "react"

interface UseCarouselProps {
  totalItems: number
  itemsPerView?: number
  autoPlay?: boolean
  autoPlayInterval?: number
}

export function useCarousel({
  totalItems,
  itemsPerView = 1,
  autoPlay = false,
  autoPlayInterval = 5000,
}: UseCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)))
    },
    [maxIndex],
  )

  const toggleAutoPlay = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || totalItems <= itemsPerView) return

    const interval = setInterval(goToNext, autoPlayInterval)
    return () => clearInterval(interval)
  }, [isPlaying, goToNext, autoPlayInterval, totalItems, itemsPerView])

  return {
    currentIndex,
    isPlaying,
    goToNext,
    goToPrevious,
    goToSlide,
    toggleAutoPlay,
    canGoNext: currentIndex < maxIndex,
    canGoPrevious: currentIndex > 0,
    totalSlides: maxIndex + 1,
  }
}
