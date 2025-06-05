import { useState, useEffect, useCallback } from 'react'
import { debounce } from '@/lib/utils'

interface Document {
  id: string
  title: string
  author: string
  category: string
  subcategory?: string | null
  type: string
  description?: string | null
  coverImage?: string | null
  cover_image_url?: string | null
  year: string
  keywords?: string | null
  featured: boolean
  file_url?: string | null
  created_at: string
}

interface SearchResponse {
  documents: Document[]
  total: number
  page: number
  totalPages: number
}

interface UseSearchProps {
  enabled?: boolean
  debounceMs?: number
}

export function useSearch({ enabled = true, debounceMs = 300 }: UseSearchProps = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Document[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para realizar la búsqueda
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !enabled) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        search: query.trim(),
        limit: '8' // Limitar a 8 resultados para la búsqueda
      })

      const response = await fetch(`/api/documents-public?${params}`)
      
      if (!response.ok) {
        throw new Error('Error al buscar documentos')
      }

      const data: SearchResponse = await response.json()
      setSearchResults(data.documents)
    } catch (err) {
      console.error('Error en búsqueda:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [enabled])

  // Función debounced para la búsqueda
  const debouncedSearch = useCallback(
    debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  )

  // Efecto para ejecutar la búsqueda cuando cambia la query
  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  // Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setError(null)
    setIsSearching(false)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    error,
    clearSearch,
    hasResults: searchResults.length > 0,
    hasQuery: searchQuery.trim().length > 0
  }
}
