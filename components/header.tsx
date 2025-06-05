"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Search, User, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { documents } from "@/data/documents"
import { SearchDesktop } from "./header/search-desktop"

export function Header() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollDirection, setScrollDirection] = useState("up")
  const lastScrollY = useRef(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isUserAnimating, setIsUserAnimating] = useState(false)

  // Detectar scroll para cambiar el estilo del header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setScrollDirection("down")
      } else {
        setScrollDirection("up")
      }

      lastScrollY.current = currentScrollY
      setIsScrolled(currentScrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "General", href: "/" },
    { name: "Artículos", href: "/articulos" },
    { name: "Proyectos", href: "/proyectos" },
    { name: "Trabajo de grado", href: "/trabajo-de-grado" },
    { name: "Fichas", href: "/fichas" },
    { name: "Libros", href: "/libros" },
    { name: "Otros", href: "/otras-publicaciones" },
  ]

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const linkBaseClass = "text-base font-medium transition-all duration-200 relative py-2 px-1"
  const iconButtonClass = "text-white/80 hover:text-white hover:bg-white/10 rounded-full p-4"

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof documents>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        const query = searchQuery.toLowerCase()

        // Función para calcular la relevancia de un documento
        const calculateRelevance = (doc) => {
          const title = doc.title.toLowerCase()
          const author = doc.author.toLowerCase()
          const category = doc.category.toLowerCase()
          const description = doc.description?.toLowerCase() || ""
          const subcategory = doc.subcategory?.toLowerCase() || ""

          let score = 0

          // Máxima prioridad: título comienza con la búsqueda
          if (title.startsWith(query)) {
            score += 1000
          }

          // Alta prioridad: primeras palabras del título coinciden
          const titleWords = title.split(" ")
          const queryWords = query.split(" ")

          for (let i = 0; i < Math.min(titleWords.length, queryWords.length); i++) {
            if (titleWords[i].startsWith(queryWords[i])) {
              score += 500 - i * 50 // Más puntos para palabras más tempranas
            }
          }

          // Media-alta prioridad: cualquier palabra del título coincide exactamente
          titleWords.forEach((word, index) => {
            if (queryWords.some((qWord) => word === qWord)) {
              score += 200 - index * 10
            }
          })

          // Media prioridad: título contiene la búsqueda
          if (title.includes(query)) {
            score += 100
          }

          // Prioridad media-baja: autor coincide
          if (author.includes(query)) {
            score += 50
          }

          // Baja prioridad: categoría coincide
          if (category.includes(query)) {
            score += 30
          }

          // Baja prioridad: subcategoría coincide
          if (subcategory.includes(query)) {
            score += 20
          }

          // Muy baja prioridad: descripción coincide
          if (description.includes(query)) {
            score += 10
          }

          return score
        }

        // Filtrar y ordenar por relevancia
        const filtered = documents
          .map((doc) => ({
            ...doc,
            relevance: calculateRelevance(doc),
          }))
          .filter((doc) => doc.relevance > 0)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 8)

        setSearchResults(filtered)
        setShowSearchResults(true)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 150)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  return (
    <header
      className={cn(
        "absolute top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        "bg-transparent",
        scrollDirection === "down" && isScrolled ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <div className="w-full px-6 md:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo y navegación principal */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 group"
              onClick={() => {
                setIsAnimating(true)
                setTimeout(() => setIsAnimating(false), 1200)
              }}
            >
              <div className="relative h-9 w-9 text-white cursor-pointer">
                <BookOpen
                  className={`h-9 w-9 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                    isAnimating ? "scale-110 rotate-12" : "scale-100 rotate-0"
                  }`}
                />
                {/* Efecto de brillo */}
                <div
                  className={`absolute inset-0 rounded-full bg-white/20 transition-all duration-700 group-hover:scale-150 group-hover:opacity-100 group-hover:animate-ping ${
                    isAnimating ? "scale-150 opacity-100 animate-ping" : "scale-100 opacity-0"
                  }`}
                />
              </div>
            </Link>

            {/* Navegación principal - visible en desktop */}
            <nav className="hidden md:flex items-center gap-10" role="navigation" aria-label="Navegación principal">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    linkBaseClass,
                    pathname === item.href
                      ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:rounded-full"
                      : "text-white/80 hover:text-white hover:scale-105",
                  )}
                  onClick={(e) => {
                    // Prevenir comportamiento por defecto si ya estamos en la página
                    if (pathname === item.href) {
                      e.preventDefault()
                      return
                    }
                  }}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Controles del lado derecho */}
          <div className="flex items-center gap-8 mr-4">
            {/* Buscador - solo en desktop */}
            <div className="hidden md:block relative">
              <SearchDesktop />
            </div>

            {/* Botón de usuario/login */}
            <Link href="/login">
              <Button
                variant="ghost"
                size="icon"
                className={cn(iconButtonClass, "group relative overflow-hidden")}
                onClick={() => {
                  setIsUserAnimating(true)
                  setTimeout(() => setIsUserAnimating(false), 600)
                }}
              >
                <User
                  className={`h-9 w-9 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                    isUserAnimating ? "scale-125 rotate-180" : "scale-100 rotate-0"
                  }`}
                />
                {/* Efecto de brillo para el botón de usuario */}
                <div
                  className={`absolute inset-0 rounded-full bg-white/10 transition-all duration-300 group-hover:scale-110 group-hover:opacity-50 ${
                    isUserAnimating ? "scale-150 opacity-100 animate-pulse" : "scale-100 opacity-0"
                  }`}
                />
                <span className="sr-only">Iniciar sesión como administrador</span>
              </Button>
            </Link>

            {/* Botón de menú móvil */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("md:hidden", iconButtonClass)}
              onClick={handleMobileMenuToggle}
              aria-label="Menú"
            >
              <Menu className="h-9 w-9" />
              <span className="sr-only">Menú</span>
            </Button>
          </div>
        </div>

        {/* Menú móvil */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t border-white/10 bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-md",
            mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <nav className="py-4">
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block py-2 text-base font-medium transition-colors",
                      pathname === item.href ? "text-white" : "text-gray-300 hover:text-white",
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="pt-4 border-t border-gray-800">
                {/* Buscador móvil */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
                  />

                  {/* Resultados móviles */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="mt-2 bg-gray-800/90 border border-gray-700 rounded-lg max-h-60 overflow-y-auto">
                      {searchResults.map((doc) => (
                        <Link
                          key={doc.id}
                          href={`/documents/${doc.id}`}
                          className="block p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            setSearchQuery("")
                            setShowSearchResults(false)
                          }}
                        >
                          <h4 className="font-medium text-white text-sm line-clamp-2 mb-1">{doc.title}</h4>
                          <p className="text-xs text-gray-400">{doc.author}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-white text-black hover:bg-gray-200">
                    <User className="h-4 w-4 mr-2" />
                    Iniciar sesión
                  </Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
