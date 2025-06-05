import type { Book } from "@/types/book"

// Limpiamos los datos de prueba
export const featuredBooks: Book[] = []

// Adaptamos las funciones para trabajar con la API
export const getFilteredBooks = async (pathname: string, books?: Book[]): Promise<Book[]> => {
  // Si se proporcionan libros específicos, los filtramos
  if (books && books.length > 0) {
    return filterBooksByPathname(pathname, books)
  }

  // Si no, obtenemos los libros destacados de la API
  try {
    const type = getTypeFromPathname(pathname)
    const params = new URLSearchParams({
      featured: "true",
      limit: "12",
    })

    if (type !== "all") {
      params.append("type", type)
    }

    const response = await fetch(`/api/documents-public?${params}`)
    if (!response.ok) throw new Error("Error al cargar documentos destacados")

    const data = await response.json()
    return data.documents.map(mapDocumentToBook)
  } catch (error) {
    console.error("Error fetching featured books:", error)
    return []
  }
}

// Función auxiliar para filtrar libros por ruta
function filterBooksByPathname(pathname: string, books: Book[]): Book[] {
  const type = getTypeFromPathname(pathname)

  if (type === "all") {
    return books
  } else {
    return books.filter((book) => book.type === type)
  }
}

// Función auxiliar para obtener el tipo de documento según la ruta
function getTypeFromPathname(pathname: string): string {
  if (pathname === "/articulos") return "articulos"
  if (pathname === "/trabajo-de-grado") return "trabajo-de-grado"
  if (pathname === "/fichas") return "fichas"
  if (pathname === "/libros") return "libros"
  if (pathname === "/otras-publicaciones") return "otras-publicaciones"
  if (pathname === "/proyectos") return "proyectos"
  return "all"
}

// Función para mapear un documento de la API al formato de libro para el carrusel
function mapDocumentToBook(doc: any): Book {
  return {
    id: doc.id,
    title: doc.title,
    author: doc.author,
    category: doc.category,
    subcategory: doc.subcategory || "",
    type: doc.type,
    rating: 4.5, // Valor por defecto
    year: doc.year || "",
    coverImage: doc.cover_image_url || "/placeholder.svg",
    description: doc.description || "",
    featured: true,
  }
}

export const getAutoTitle = (pathname: string, customTitle?: string): string => {
  if (customTitle) return customTitle

  switch (pathname) {
    case "/articulos":
      return "Artículos Destacados"
    case "/trabajo-de-grado":
      return "Trabajos de Grado Destacados"
    case "/fichas":
      return "Fichas Destacadas"
    case "/libros":
      return "Libros Destacados"
    case "/otras-publicaciones":
      return "Publicaciones Destacadas"
    case "/proyectos":
      return "Proyectos Destacados"
    default:
      return "Documentos Destacados"
  }
}
