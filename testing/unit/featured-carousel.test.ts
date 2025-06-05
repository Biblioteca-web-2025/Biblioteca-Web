import { renderHook, act } from "@testing-library/react"
import { useFeaturedCarousel } from "@/hooks/use-featured-carousel"
import { getFilteredBooks, getAutoTitle } from "@/data/featured-books"
import type { Book } from "@/types/book"
import jest from "jest" // Import jest to declare the variable

// Mock de usePathname
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

const mockBooks: Book[] = [
  {
    id: "1",
    title: "Test Book 1",
    author: "Test Author 1",
    category: "Test",
    type: "articulos",
    rating: 4.5,
    year: "2023",
    coverImage: "/test1.jpg",
    description: "Test description 1",
    featured: true,
  },
  {
    id: "2",
    title: "Test Book 2",
    author: "Test Author 2",
    category: "Test",
    type: "trabajo-de-grado",
    rating: 4.8,
    year: "2022",
    coverImage: "/test2.jpg",
    description: "Test description 2",
    featured: true,
  },
]

describe("useFeaturedCarousel", () => {
  beforeEach(() => {
    jest.clearAllTimers()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it("should initialize with correct default values", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: mockBooks }))

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.isAutoPlaying).toBe(true)
    expect(result.current.displayBooks).toEqual(mockBooks)
  })

  it("should navigate to next slide correctly", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: mockBooks }))

    act(() => {
      result.current.goToNext()
    })

    expect(result.current.currentIndex).toBe(1)
  })

  it("should navigate to previous slide correctly", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: mockBooks }))

    // First go to slide 1
    act(() => {
      result.current.goToNext()
    })

    // Then go back to slide 0
    act(() => {
      result.current.goToPrevious()
    })

    expect(result.current.currentIndex).toBe(0)
  })

  it("should wrap around when navigating beyond bounds", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: mockBooks }))

    // Go to last slide
    act(() => {
      result.current.goToSlide(1)
    })

    // Go to next (should wrap to first)
    act(() => {
      result.current.goToNext()
    })

    expect(result.current.currentIndex).toBe(0)
  })

  it("should toggle auto-play correctly", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: mockBooks }))

    expect(result.current.isAutoPlaying).toBe(true)

    act(() => {
      result.current.toggleAutoPlay()
    })

    expect(result.current.isAutoPlaying).toBe(false)
  })

  it("should handle empty books array gracefully", () => {
    const { result } = renderHook(() => useFeaturedCarousel({ books: [] }))

    expect(result.current.displayBooks).toEqual([])
    expect(result.current.currentIndex).toBe(0)

    // Should not crash when calling navigation functions
    act(() => {
      result.current.goToNext()
      result.current.goToPrevious()
      result.current.goToSlide(0)
    })
  })
})

describe("getFilteredBooks", () => {
  it("should filter books by articulos type", () => {
    const result = getFilteredBooks("/articulos", mockBooks)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("articulos")
  })

  it("should filter books by trabajo-de-grado type", () => {
    const result = getFilteredBooks("/trabajo-de-grado", mockBooks)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("trabajo-de-grado")
  })

  it("should return all books for home page", () => {
    const result = getFilteredBooks("/", mockBooks)
    expect(result).toEqual(mockBooks)
  })
})

describe("getAutoTitle", () => {
  it("should return correct title for articulos page", () => {
    const result = getAutoTitle("/articulos")
    expect(result).toBe("Artículos Destacados")
  })

  it("should return custom title when provided", () => {
    const customTitle = "Custom Title"
    const result = getAutoTitle("/articulos", customTitle)
    expect(result).toBe(customTitle)
  })

  it("should return default title for unknown paths", () => {
    const result = getAutoTitle("/unknown")
    expect(result).toBe("Documentos Destacados")
  })
})
