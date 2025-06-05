// Utilidades para manejo de documentos

export const documentTypeLabels: Record<string, string> = {
  articulos: "Artículos",
  proyectos: "Proyectos",
  "trabajo-de-grado": "Trabajo de grado",
  fichas: "Fichas",
  libros: "Libros",
  "otras-publicaciones": "Otras publicaciones",
}

export const getDocumentTypeLabel = (type: string): string => {
  return documentTypeLabels[type] || type
}

export const formatDocumentForDisplay = (doc: any) => {
  return {
    ...doc,
    typeLabel: getDocumentTypeLabel(doc.type),
    formattedDate: doc.year ? `Año ${doc.year}` : "Sin fecha",
    shortDescription: doc.description?.length > 100 ? `${doc.description.substring(0, 100)}...` : doc.description,
  }
}

// Función para generar ID único para nuevos documentos
export const generateDocumentId = (): string => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Función para validar archivo PDF
export const validatePdfFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "No se ha seleccionado ningún archivo" }
  }

  if (file.type !== "application/pdf") {
    return { isValid: false, error: "El archivo debe ser un PDF" }
  }

  // Límite de 50MB
  if (file.size > 50 * 1024 * 1024) {
    return { isValid: false, error: "El archivo no puede ser mayor a 50MB" }
  }

  return { isValid: true }
}

// Función para validar imagen de portada
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!file) {
    return { isValid: false, error: "No se ha seleccionado ninguna imagen" }
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "La imagen debe ser JPG, PNG o WebP" }
  }

  // Límite de 5MB para imágenes
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: "La imagen no puede ser mayor a 5MB" }
  }

  return { isValid: true }
}
