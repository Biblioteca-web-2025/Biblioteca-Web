"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { FileText, Home, Library } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"
import { useDocumentsComplete } from "@/hooks/use-documents-complete"

// Constantes para los enlaces del sidebar
const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
]

// Función utilitaria para las clases de los botones
const getButtonClasses = (isActive: boolean) =>
  cn(
    "w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
    "hover:bg-accent hover:text-accent-foreground text-left",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground",
  )

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get real documents from database
  const { documents: dbDocuments = [], loading } = useDocumentsComplete({
    page: 1,
    limit: 1000 // Get all documents for counts
  })

  // Obtener el filtro actual de la URL, por defecto "all"
  const currentFilter = searchParams.get("filter") || "all"

  // Calcular conteos de documentos de manera eficiente con useMemo
  const filterTags = useMemo(() => {
    // Calcular conteos en una sola pasada con reduce
    const documentCounts = dbDocuments.reduce<Record<string, number>>((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1
      return acc
    }, {})

    return [
      {
        title: "Todos los documentos",
        tag: "all",
        icon: FileText,
        count: dbDocuments.length,
      },
      {
        title: "Artículos",
        tag: "articulos",
        icon: Library,
        count: documentCounts["articulos"] || 0,
      },
      {
        title: "Proyectos",
        tag: "proyectos",
        icon: Library,
        count: documentCounts["proyectos"] || 0,
      },
      {
        title: "Trabajo de grado",
        tag: "trabajo-de-grado",
        icon: Library,
        count: documentCounts["trabajo-de-grado"] || 0,
      },
      {
        title: "Fichas",
        tag: "fichas",
        icon: Library,
        count: documentCounts["fichas"] || 0,
      },
      {
        title: "Libros",
        tag: "libros",
        icon: Library,
        count: documentCounts["libros"] || 0,
      },
      {
        title: "Otras publicaciones",
        tag: "otras-publicaciones",
        icon: Library,
        count: documentCounts["otras-publicaciones"] || 0,
      },
    ]
  }, [dbDocuments])

  const handleFilterChange = useCallback(
    (tag: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (tag === "all") {
        params.delete("filter")
      } else {
        params.set("filter", tag)
      }

      const newUrl = `${pathname}?${params.toString()}`
      router.push(newUrl)

      // Disparar evento personalizado para actualizar la tabla
      if (process.env.NODE_ENV === "development") {
        console.log("Filtro aplicado:", tag)
      }

      window.dispatchEvent(
        new CustomEvent("filterChange", {
          detail: { filterType: tag },
        }),
      )
    },
    [pathname, router, searchParams],
  )

  // Efecto para sincronizar el filtro inicial
  useEffect(() => {
    const currentFilter = searchParams.get("filter") || "all"
    window.dispatchEvent(
      new CustomEvent("filterChange", {
        detail: { filterType: currentFilter },
      }),
    )
  }, [searchParams])

  return (
    <aside className="w-64 border-r h-[calc(100vh-4rem)] hidden md:block">
      <div className="flex flex-col h-full">
        {/* Header del sidebar */}
        <div className="p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">Panel de Control</h2>
          <p className="text-sm text-muted-foreground">Administración de biblioteca</p>
        </div>

        {/* Navegación principal */}
        <div className="flex-1 p-4">
          <nav className="space-y-6">
            {/* Dashboard Link */}
            <div role="navigation" aria-label="Navegación principal">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <link.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{link.title}</span>
                    {isActive && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary-foreground/80" aria-hidden="true" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Filtros por Tags */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                Filtrar por tipo
              </h3>
              <div className="space-y-1" role="navigation" aria-label="Filtros de documentos">
                {filterTags.map((filter) => {
                  const isActive = currentFilter === filter.tag

                  return (
                    <button
                      key={filter.tag}
                      onClick={() => handleFilterChange(filter.tag)}
                      className={getButtonClasses(isActive)}
                      aria-pressed={isActive}
                      aria-label={`Filtrar por ${filter.title}`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <filter.icon
                          className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{filter.title}</span>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full transition-colors ml-auto min-w-[2rem] text-center overflow-hidden truncate",
                            isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                          )}
                          title={`${filter.count} documentos`}
                        >
                          {filter.count}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Administrador</p>
              <p className="text-xs text-muted-foreground truncate">admin@biblioteca.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
