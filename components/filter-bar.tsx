"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Crear contexto para los filtros
export const FilterContext = createContext<{
  filters: Record<string, string>
  searchQuery: string
}>({
  filters: {},
  searchQuery: "",
})

// Añadir hook para usar el contexto
export const useFilters = () => useContext(FilterContext)

export type FilterOption = {
  value: string
  label: string
}

export type FilterCategory = {
  name: string
  options: FilterOption[]
}

export type FilterGroupItem = {
  id: string
  name: string
}

export type FilterGroup = {
  id: string
  title: string
  items: FilterGroupItem[]
}

interface FilterBarProps {
  categories?: FilterCategory[]
  filterGroups?: FilterGroup[]
  onFilterChange?: (filters: Record<string, string>) => void
  className?: string
  showTabs?: boolean
  tabOptions?: { value: string; label: string }[]
  onTabChange?: (tab: string) => void
}

export function FilterBar({
  categories = [],
  filterGroups = [],
  onFilterChange,
  className,
  showTabs = false,
  tabOptions = [],
  onTabChange,
}: FilterBarProps) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("todos")

  // Actualizar filtros cuando cambian
  useEffect(() => {
    onFilterChange?.(filters)
  }, [filters, onFilterChange])

  // Manejar cambios en los filtros
  const handleFilterChange = (category: string, value: string) => {
    // Si el valor es "all", elimina el filtro
    if (value === "all") {
      setFilters((prev) => {
        const newFilters = { ...prev }
        delete newFilters[category]
        return newFilters
      })
    } else {
      setFilters((prev) => ({
        ...prev,
        [category]: value,
      }))
    }

    // Aplicar filtros inmediatamente
    setTimeout(() => {
      onFilterChange?.(filters)
    }, 0)
  }

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFilters({})
  }

  // Eliminar un filtro específico
  const removeFilter = (category: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[category]
      return newFilters
    })
  }

  // Obtener etiqueta para un valor de filtro
  const getFilterLabel = (category: string, value: string): string => {
    if (categories.length > 0) {
      const categoryObj = categories.find((c) => c.name === category)
      if (!categoryObj) return value

      const option = categoryObj.options.find((o) => o.value === value)
      return option?.label || value
    }

    if (filterGroups.length > 0) {
      const filterGroup = filterGroups.find((fg) => fg.id === category)
      if (!filterGroup) return value

      const item = filterGroup.items.find((i) => i.id === value)
      return item?.name || value
    }

    return value
  }

  // Tabs disponibles
  const tabs = tabOptions || []

  // Proporcionar el contexto
  const filterContextValue = {
    filters,
    searchQuery,
  }

  return (
    <FilterContext.Provider value={filterContextValue}>
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-lg bg-background border border-border/20 mb-8 shadow-sm",
          className,
        )}
      >
        {categories.map((category) => (
          <div key={category.name} className="flex flex-col space-y-2">
            <label className="text-sm font-medium">{category.name}</label>
            <Select
              value={filters[category.name] || ""}
              onValueChange={(value) => handleFilterChange(category.name, value)}
            >
              <SelectTrigger className="w-full bg-background border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue placeholder={`Seleccionar ${category.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {category.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {Object.keys(filters).length > 0 && (
          <div className="flex items-center gap-2 md:col-span-3 mt-2">
            <Button variant="default" size="sm" onClick={() => onFilterChange?.(filters)}>
              Aplicar filtros
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          </div>
        )}
      </div>
    </FilterContext.Provider>
  )
}
