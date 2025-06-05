// Datos centralizados de documentos para toda la aplicación
export const documents: any[] = []

// Función helper para filtrar documentos por tipo
export const getDocumentsByType = (type: string) => {
  return documents.filter((doc) => doc.type === type)
}

// Función helper para obtener todas las categorías únicas
export const getUniqueCategories = () => {
  return [...new Set(documents.map((doc) => doc.category))]
}

// Función helper para obtener todas las subcategorías únicas
export const getUniqueSubcategories = () => {
  return [...new Set(documents.map((doc) => doc.subcategory))]
}

// Función helper para obtener todos los años únicos
export const getUniqueYears = () => {
  return [...new Set(documents.map((doc) => doc.year))].sort((a, b) => Number.parseInt(b) - Number.parseInt(a))
}

// Función para validar tipos de documento
export const getValidDocumentTypes = () => {
  return [
    { value: "articulos", label: "Artículos" },
    { value: "proyectos", label: "Proyectos" },
    { value: "trabajo-de-grado", label: "Trabajo de grado" },
    { value: "fichas", label: "Fichas" },
    { value: "libros", label: "Libros" },
    { value: "otras-publicaciones", label: "Otras publicaciones" },
  ]
}
