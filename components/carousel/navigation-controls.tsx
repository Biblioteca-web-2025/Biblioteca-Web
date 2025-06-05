"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface NavigationControlsProps {
  title: string
  onPrevious: () => void
  onNext: () => void
  canGoPrevious: boolean
  canGoNext: boolean
}

export function NavigationControls({ title, onPrevious, onNext, canGoPrevious, canGoNext }: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-white text-xl font-semibold">Documentos</h3>
      <div className="flex gap-2" role="group" aria-label="Controles de navegación del carrusel">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="text-white hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Libro anterior"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          disabled={!canGoNext}
          className="text-white hover:bg-white/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Siguiente libro"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
