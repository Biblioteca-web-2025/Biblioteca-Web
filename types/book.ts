export interface Book {
  id: string
  title: string
  author: string
  category: string
  subcategory?: string
  type: "trabajo-de-grado" | "articulos" | "fichas" | "libros" | "otras-publicaciones" | "proyectos"
  rating: number
  year: string
  coverImage: string
  description: string
  featured: boolean
}

export interface CarouselProps {
  filterBy?: "category" | "subcategory" | "type"
  filterValue?: string
  title?: string
  books?: Book[]
}

export interface UseCarouselReturn {
  currentIndex: number
  isAutoPlaying: boolean
  displayBooks: Book[]
  displayTitle: string
  loading: boolean
  error: string | null
  goToNext: () => void
  goToPrevious: () => void
  goToSlide: (index: number) => void
  toggleAutoPlay: () => void
}
