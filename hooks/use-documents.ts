"use client"

import { useState, useEffect } from "react"

export interface Document {
  id: string
  title: string
  author: string
  category: string
  subcategory?: string
  year: string
  cover_image_url?: string
  pdf_url?: string
  type: string
  description?: string
  keywords?: string
  editorial?: string
  isbn?: string
  pages?: number
  location?: string
  created_at: string
  updated_at: string
}

export interface DocumentsResponse {
  documents: Document[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useDocuments(type?: string, search?: string, page = 1, limit = 10) {
  const [data, setData] = useState<DocumentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })

        if (type) params.append("type", type)
        if (search) params.append("search", search)

        const response = await fetch(`/api/documents?${params}`)

        if (!response.ok) {
          throw new Error("Error al cargar los documentos")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [type, search, page, limit])

  return { data, loading, error, refetch: () => setData(null) }
}

export function useDocument(id: string) {
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/documents/${id}`)

        if (!response.ok) {
          throw new Error("Documento no encontrado")
        }

        const result = await response.json()
        setDocument(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDocument()
    }
  }, [id])

  return { document, loading, error }
}
