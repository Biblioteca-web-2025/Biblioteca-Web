'use client';

import { useState } from 'react';
import { useCreateDocument } from '@/hooks/use-documents-complete';

interface DocumentUploadFormCompleteProps {
  onSuccess?: (document: any) => void;
  onCancel?: () => void;
}

export function DocumentUploadFormComplete({ onSuccess, onCancel }: DocumentUploadFormCompleteProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [coverDragActive, setCoverDragActive] = useState(false);

  const { createDocument, loading, error } = useCreateDocument();

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

  const handleDrag = (e: React.DragEvent, isCover = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      if (isCover) {
        setCoverDragActive(true);
      } else {
        setDragActive(true);
      }
    } else if (e.type === 'dragleave') {
      if (isCover) {
        setCoverDragActive(false);
      } else {
        setDragActive(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, isCover = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCover) {
      setCoverDragActive(false);
    } else {
      setDragActive(false);
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isCover) {
        if (droppedFile.type.startsWith('image/')) {
          setCoverImage(droppedFile);
        } else {
          alert('Por favor selecciona un archivo de imagen para la portada');
        }
      } else {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (isCover) {
        if (selectedFile.type.startsWith('image/')) {
          setCoverImage(selectedFile);
        } else {
          alert('Por favor selecciona un archivo de imagen para la portada');
        }
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !file) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('file', file);
      
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      const result = await createDocument(formData);
      
      console.log('✅ Documento creado exitosamente:', result);
      
      // Limpiar formulario
      setTitle('');
      setDescription('');
      setCategory('');
      setFile(null);
      setCoverImage(null);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      alert('Documento subido exitosamente!');
    } catch (err) {
      console.error('❌ Error al crear documento:', err);
      alert('Error al subir el documento: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📚 Subir Documento Completo
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa el título del documento"
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe el contenido del documento"
            required
          />
        </div>

        {/* Categoría */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Archivo principal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo del Documento *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => handleDrag(e)}
            onDragLeave={(e) => handleDrag(e)}
            onDragOver={(e) => handleDrag(e)}
            onDrop={(e) => handleDrop(e)}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              type="file"
              id="file-input"
              onChange={(e) => handleFileChange(e)}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.rtf"
            />
            
            {file ? (
              <div className="text-green-600">
                <p className="font-medium">📄 {file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • {file.type}
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="text-lg mb-2">📎 Arrastra el archivo aquí</p>
                <p className="text-sm">o haz clic para seleccionar</p>
                <p className="text-xs mt-2">Formatos soportados: PDF, DOC, DOCX, TXT, RTF</p>
                <p className="text-xs">Tamaño máximo: 50MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Imagen de portada */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen de Portada (Opcional)
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              coverDragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, true)}
            onDragOver={(e) => handleDrag(e, true)}
            onDrop={(e) => handleDrop(e, true)}
            onClick={() => document.getElementById('cover-input')?.click()}
          >
            <input
              type="file"
              id="cover-input"
              onChange={(e) => handleFileChange(e, true)}
              className="hidden"
              accept="image/*"
            />
            
            {coverImage ? (
              <div className="text-green-600">
                <p className="font-medium">🖼️ {coverImage.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(coverImage.size)} • {coverImage.type}
                </p>
              </div>
            ) : (
              <div className="text-gray-500">
                <p className="text-lg mb-2">🖼️ Arrastra la imagen aquí</p>
                <p className="text-sm">o haz clic para seleccionar</p>
                <p className="text-xs mt-2">Formatos soportados: JPG, PNG, GIF, WebP</p>
                <p className="text-xs">Tamaño máximo: 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading || !title || !description || !category || !file}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Subiendo...' : '📤 Subir Documento'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
