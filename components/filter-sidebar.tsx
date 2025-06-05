"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Filter, X } from "lucide-react"
import { useState } from "react"

interface FilterCategory {
  name: string
  options: { value: string; label: string }[]
}

interface FilterSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  categories: FilterCategory[]
  onFilterChange: (filters: Record<string, string>) => void
  activeFilters: Record<string, string>
}

export function FilterSidebar({ 
  className, 
  categories, 
  onFilterChange, 
  activeFilters, 
  ...props 
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleFilterChange = (categoryName: string, value: string) => {
    const newFilters = { ...activeFilters }
    
    if (value === 'all' || value === '') {
      delete newFilters[categoryName]
    } else {
      newFilters[categoryName] = value
    }
    
    onFilterChange(newFilters)
  }

  const clearAllFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0

  return (
    <>
      <Button variant="outline" className="md:hidden mb-4 flex items-center" onClick={() => setIsOpen(true)}>
        <Filter className="h-4 w-4 mr-2" />
        Filtros
      </Button>

      <div
        className={cn(
          "bg-background fixed inset-y-0 left-0 z-50 w-full max-w-xs p-6 shadow-lg border-r md:static md:border-0 md:shadow-none transition-transform md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between mb-6 md:hidden">
          <h2 className="font-semibold text-lg">Filtros</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Mostrar filtros activos */}
          {hasActiveFilters && (
            <div className="pb-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">Filtros activos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs h-6 px-2"
                >
                  Limpiar todos
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([category, value]) => (
                  <div
                    key={`${category}-${value}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                  >
                    <span>{category}: {value}</span>
                    <button
                      onClick={() => handleFilterChange(category, 'all')}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtros dinámicos basados en las categorías */}
          {categories.map((category) => (
            <div key={category.name}>
              <h3 className="font-medium mb-3">{category.name}</h3>
              <Select
                value={activeFilters[category.name] || 'all'}
                onValueChange={(value) => handleFilterChange(category.name, value)}
              >
                <SelectTrigger className="w-full">
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
        </div>
      </div>
    </>
  )
}
