"use client"

import { useState, useRef, useEffect } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SearchResults } from "./search-results"
import { useRouter } from "next/navigation"
import { useSearch } from "@/hooks/use-search"

export function SearchDesktop() {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Usar el hook de búsqueda personalizado
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    error,
    clearSearch,
    hasResults,
    hasQuery
  } = useSearch()

  // Mostrar resultados cuando hay query y no está expandido sin resultados
  useEffect(() => {
    setShowSearchResults(hasQuery && searchExpanded)
  }, [hasQuery, searchExpanded])

  const handleToggleSearch = () => {
    setSearchExpanded(!searchExpanded)
    if (!searchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 300)
    } else {
      clearSearch()
      setShowSearchResults(false)
    }
  }

  const handleSearchResultClick = (bookId: string) => {
    clearSearch()
    setShowSearchResults(false)
    setSearchExpanded(false)
    router.push(`/documents/${bookId}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleInputBlur = () => {
    setTimeout(() => {
      const activeElement = document.activeElement
      const container = searchContainerRef.current

      // Check if the active element is within our search container
      if (!activeElement || !container?.contains(activeElement)) {
        setSearchExpanded(false)
        setShowSearchResults(false)
      }
    }, 200)
  }

  return (
    <div className="hidden md:block relative" ref={searchContainerRef}>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-3"
          onClick={handleToggleSearch}
          aria-label="Buscar documentos"
        >
          <Search className="h-9 w-9 transition-transform duration-200 hover:scale-110 hover:rotate-12" />
        </Button>
        <Input
          ref={searchInputRef}
          placeholder="Buscar documentos..."
          value={searchQuery}
          onChange={handleInputChange}
          className={cn(
            "absolute right-0 top-0 h-10 py-2 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/40 backdrop-blur-sm transition-all duration-300",
            searchExpanded ? "w-64 opacity-100 px-10" : "w-0 opacity-0 px-0",
          )}
          onBlur={handleInputBlur}
        />
      </div>

      <SearchResults
        results={searchResults}
        showResults={showSearchResults}
        searchQuery={searchQuery}
        onResultClick={handleSearchResultClick}
        isLoading={isSearching}
        error={error}
      />
    </div>
  )
}
