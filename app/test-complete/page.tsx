'use client';

import { useState } from 'react';
import { DocumentUploadFormComplete } from '@/components/document-upload-form-complete';
import { useDocumentsComplete } from '@/hooks/use-documents-complete';

export default function TestCompletePage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { documents, total, totalPages, loading, error, refetch } = useDocumentsComplete({
    page: currentPage,
    limit: 10,
    search: searchTerm || undefined,
    category: selectedCategory || undefined
  });

  const categories = [
    'Académico',
    'Científico',
    'Literatura',
    'Historia',
    'Tecnología',
    'Arte',
    'Medicina',
    'Derecho',
    'Economía',
    'Otros'
  ];

  const handleDocumentCreated = (document: any) => {
    console.log('✅ Documento creado:', document);
    setShowUploadForm(false);
    refetch(); // Actualizar la lista
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Sistema de Documentos Completo - Pruebas
          </h1>
          <p className="text-gray-600">
            Prueba el sistema completo de gestión de documentos con soporte para imágenes de portada
          </p>
        </div>

        {/* Formulario de upload */}
        {showUploadForm && (
          <div className="mb-8">
            <DocumentUploadFormComplete
              onSuccess={handleDocumentCreated}
              onCancel={() => setShowUploadForm(false)}
            />
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              📚 Documentos ({total})
            </h2>
            
            <button
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              {showUploadForm ? '❌ Cancelar' : '➕ Subir Documento'}
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando documentos...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 mb-4">❌ {error}</p>
              <button
                onClick={refetch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 Reintentar
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-4">📝 No hay documentos disponibles</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                ➕ Subir primer documento
              </button>
            </div>
          ) : (
            <>
              {/* Grid de documentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Imagen de portada */}
                    {document.cover_image_url && (
                      <div className="mb-4">
                        <img
                          src={document.cover_image_url}
                          alt={`Portada de ${document.title}`}
                          className="w-full h-32 object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    {/* Información del documento */}
                    <h3 className="font-semibold text-gray-900 mb-2 truncate" title={document.title}>
                      📄 {document.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {document.description}
                    </p>
                    
                    {/* Metadatos */}
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>📁 Categoría:</span>
                        <span className="font-medium">{document.category}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>📊 Tamaño:</span>
                        <span>{formatFileSize(document.file_size)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>📅 Subido:</span>
                        <span>{formatDate(document.upload_date)}</span>
                      </div>
                      
                      {document.file_type && (
                        <div className="flex justify-between">
                          <span>🔧 Tipo:</span>
                          <span className="uppercase">{document.file_type}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Enlaces */}
                    <div className="mt-4 flex gap-2">
                      {document.file_url && (
                        <a
                          href={document.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white text-center py-1 px-2 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          📖 Ver
                        </a>
                      )}
                      
                      {document.file_url && (
                        <a
                          href={document.file_url}
                          download
                          className="flex-1 bg-green-600 text-white text-center py-1 px-2 rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          💾 Descargar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-6 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>
                  
                  <span className="px-4 py-1 text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
