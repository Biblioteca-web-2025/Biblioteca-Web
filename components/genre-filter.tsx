"use client"
import { BookOpen, FileText, GraduationCap, Library } from "lucide-react"
import { useRouter } from "next/navigation"

interface GenreFilterProps {
  onFilterChange: (genre: string) => void
  activeGenre: string
}

const genres = [
  {
    id: "inicio",
    name: "Inicio",
    icon: BookOpen,
    description: "Todos los documentos",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "articulos",
    name: "Artículos",
    icon: FileText,
    description: "Artículos académicos",
    color: "from-green-500 to-green-600",
  },
  {
    id: "trabajo-de-grado",
    name: "Trabajo de Grado",
    icon: GraduationCap,
    description: "Tesis y trabajos de grado",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "fichas",
    name: "Fichas",
    icon: Library,
    description: "Fichas bibliográficas",
    color: "from-orange-500 to-orange-600",
  },
]

export function GenreFilter({ onFilterChange, activeGenre }: GenreFilterProps) {
  const router = useRouter()
  return <></>
}
