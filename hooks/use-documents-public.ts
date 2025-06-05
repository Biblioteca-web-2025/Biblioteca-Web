import { useState, useEffect } from 'react'
import { fetchWithRetry, debounce } from '@/lib/request-utils';

interface Document {
  id: string;
  title: string;
  description: string;
  author: string;
  category: string;
  type: string;
  year: string;
  keywords?: string;
  pages?: number;
  editorial?: string;
  isbn?: string;
  location?: string;
  file_url?: string;
  cover_image_url?: string;
  file_size?: number;
  file_type?: string;
  upload_date: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
  page: number;
  totalPages: number;
}

interface UseDocumentsPublicProps {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  search?: string;
}

export function useDocumentsPublic({
  page = 1,
  limit = 10,
  category,
  type,
  search
}: UseDocumentsPublicProps = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
        ...(type && { type }),
        ...(search && { search })
      });

      const response = await fetchWithRetry(`/api/documents-public?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener documentos');
      }

      const data: DocumentsResponse = await response.json();
      setDocuments(data.documents);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching public documents:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }  };

  // Debounce fetchDocuments para evitar llamadas excesivas
  const debouncedFetchDocuments = debounce(fetchDocuments, 300);
  
  useEffect(() => {
    debouncedFetchDocuments();
  }, [page, limit, category, type, search]);

  return {
    documents,
    total,
    totalPages,
    loading,
    error,
    refetch: fetchDocuments
  };
}
