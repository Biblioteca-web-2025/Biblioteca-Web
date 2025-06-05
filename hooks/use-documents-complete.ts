import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

interface UseDocumentsCompleteProps {
  page?: number;
  limit?: number;
  category?: string;
  type?: string;
  search?: string;
}

// Helper function to get auth token from Supabase session
async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClientComponentClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('No se encontró sesión válida en Supabase');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('Error obteniendo token de Supabase:', error);
    return null;
  }
}

export function useDocumentsComplete({
  page = 1,
  limit = 10,
  category,
  type,
  search
}: UseDocumentsCompleteProps = {}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      // Obtener token de la sesión de Supabase
      const token = await getAuthToken();
      
      if (!token) {
        console.error('No se encontró token de autenticación en useDocumentsComplete');
        throw new Error('No hay token de autenticación');
      }const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(category && { category }),
        ...(type && { type }),
        ...(search && { search })
      });

      const response = await fetch(`/api/documents-complete?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
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
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDocuments();
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

// Hook para crear documento
export function useCreateDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createDocument = async (formData: FormData): Promise<Document> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('/api/documents-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear documento');
      }

      const data = await response.json();
      return data.document;
    } catch (err) {
      console.error('Error creating document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createDocument,
    loading,
    error
  };
}

// Hook para obtener un documento específico
export function useDocument(id: string) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchDocument = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`/api/documents-complete/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener documento');
      }

      const data = await response.json();
      setDocument(data.document);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [id]);

  return {
    document,
    loading,
    error,
    refetch: fetchDocument
  };
}

// Hook para actualizar documento
export function useUpdateDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateDocument = async (id: string, formData: FormData): Promise<Document> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`/api/documents-complete/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar documento');
      }

      const data = await response.json();
      return data.document;
    } catch (err) {
      console.error('Error updating document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateDocument,
    loading,
    error
  };
}

// Hook para eliminar documento
export function useDeleteDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deleteDocument = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`/api/documents-complete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar documento');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteDocument,
    loading,
    error
  };
}
