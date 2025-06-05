"use client"

import Link from "next/link"

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

interface SearchResultsProps {
  results: Document[]
  showResults: boolean
  searchQuery: string
  onResultClick: (id: string) => void
  isLoading?: boolean
  error?: string | null
}

// Función para resaltar texto coincidente
function highlightText(text: string, searchQuery: string) {
  if (!searchQuery.trim()) return text
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="bg-yellow-300/30 text-yellow-100 px-0.5 rounded">
        {part}
      </span>
    ) : part
  )
}

export function SearchResults({ 
  results, 
  showResults, 
  searchQuery, 
  onResultClick, 
  isLoading = false,
  error = null 
}: SearchResultsProps) {
  if (!showResults) return null

  // Filtrar resultados por título que contenga el texto de búsqueda
  const filteredResults = results.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <div className="absolute top-12 right-0 w-96 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl z-50">
        {/* Textura de fondo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(59,130,246,0.1)_35%,rgba(59,130,246,0.1)_65%,transparent_65%)] bg-[length:40px_40px]"></div>
        </div>

        <div className="p-4 text-center relative z-10">
          <p className="text-white/80 text-sm">Buscando documentos...</p>
          <div className="mt-2 flex justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error
  if (error) {
    return (
      <div className="absolute top-12 right-0 w-96 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl z-50">
        {/* Textura de fondo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(59,130,246,0.1)_35%,rgba(59,130,246,0.1)_65%,transparent_65%)] bg-[length:40px_40px]"></div>
        </div>

        <div className="p-4 text-center relative z-10">
          <p className="text-red-300 text-sm">Error al buscar documentos</p>
          <p className="text-white/60 text-xs mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (filteredResults.length === 0 && searchQuery.length >= 1) {
    return (
      <div className="absolute top-12 right-0 w-96 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl z-50">
        {/* Textura de fondo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(59,130,246,0.1)_35%,rgba(59,130,246,0.1)_65%,transparent_65%)] bg-[length:40px_40px]"></div>
        </div>

        <div className="p-4 text-center relative z-10">
          <p className="text-white/80 text-sm">No se encontraron documentos</p>
          <p className="text-white/60 text-xs mt-1">Intenta con otros términos de búsqueda</p>
        </div>
      </div>
    )
  }

  if (filteredResults.length === 0) return null

  return (
    <div className="absolute top-12 right-0 w-96 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
      {/* Textura de fondo */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_35%,rgba(59,130,246,0.1)_35%,rgba(59,130,246,0.1)_65%,transparent_65%)] bg-[length:40px_40px]"></div>
      </div>

      <div className="p-2 relative z-10">
        <p className="text-xs text-white/80 px-3 py-2 border-b border-white/20">
          {filteredResults.length} resultado{filteredResults.length !== 1 ? "s" : ""} encontrado
          {filteredResults.length !== 1 ? "s" : ""}
        </p>
        {filteredResults.map((doc) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="block p-3 hover:bg-white/20 rounded-md transition-colors"
            onClick={() => onResultClick(doc.id)}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-16 bg-white/20 rounded flex-shrink-0 overflow-hidden border border-white/30">
                <img
                  src={doc.cover_image_url || doc.coverImage || "/placeholder.svg"}
                  alt={doc.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">
                  {highlightText(doc.title, searchQuery)}
                </h4>
                <p className="text-xs text-white/70 mb-2">{doc.author}</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-100 rounded-full border border-blue-400/30">
                    {doc.category}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-white/20 text-white/90 rounded-full border border-white/30">
                    {doc.type === "trabajo-de-grado"
                      ? "Trabajo de grado"
                      : doc.type === "otras-publicaciones"
                        ? "Otros"
                        : doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                  </span>
                  {doc.subcategory && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/30 text-green-100 rounded-full border border-green-400/30">
                      {doc.subcategory}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
