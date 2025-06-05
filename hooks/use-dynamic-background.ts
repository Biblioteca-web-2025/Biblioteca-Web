"use client"

import { useState, useEffect } from "react"

interface UseDynamicBackgroundProps {
  images: string[]
  currentIndex: number
}

export function useDynamicBackground({ images, currentIndex }: UseDynamicBackgroundProps) {
  const [backgroundImage, setBackgroundImage] = useState<string>("")
  const [dominantColor, setDominantColor] = useState<string>("rgba(59, 130, 246, 0.3)")

  useEffect(() => {
    if (images[currentIndex]) {
      setBackgroundImage(images[currentIndex])

      // Simular extracción de color dominante
      // En una implementación real, usarías una librería como color-thief
      const colors = [
        "rgba(59, 130, 246, 0.3)", // blue
        "rgba(147, 51, 234, 0.3)", // purple
        "rgba(239, 68, 68, 0.3)", // red
        "rgba(34, 197, 94, 0.3)", // green
        "rgba(249, 115, 22, 0.3)", // orange
      ]

      setDominantColor(colors[currentIndex % colors.length])
    }
  }, [currentIndex, images])

  return {
    backgroundImage,
    dominantColor,
  }
}
