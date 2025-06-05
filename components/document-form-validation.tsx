"use client"

import { useState } from "react"

// Hook para validación del formulario de documentos
export function useDocumentFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (formData: any) => {
    const newErrors: Record<string, string> = {}

    // Validaciones requeridas
    if (!formData.title?.trim()) {
      newErrors.title = "El título es requerido"
    }

    if (!formData.author?.trim()) {
      newErrors.author = "El autor es requerido"
    }

    if (!formData.workType) {
      newErrors.workType = "El tipo de obra es requerido"
    }

    if (!formData.knowledgeField) {
      newErrors.knowledgeField = "El campo de conocimiento es requerido"
    }

    if (!formData.summary?.trim()) {
      newErrors.summary = "El resumen es requerido"
    }

    // Validaciones de formato
    if (formData.pages && isNaN(Number(formData.pages))) {
      newErrors.pages = "El número de páginas debe ser un número válido"
    }

    if (formData.isbn && formData.isbn.length > 0 && formData.isbn.length < 10) {
      newErrors.isbn = "El ISBN/ISSN debe tener al menos 10 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearErrors = () => setErrors({})

  return {
    errors,
    validateForm,
    clearErrors,
  }
}

// Componente para mostrar errores de validación
export function ValidationError({ error }: { error?: string }) {
  if (!error) return null

  return <p className="text-sm text-destructive mt-1">{error}</p>
}
