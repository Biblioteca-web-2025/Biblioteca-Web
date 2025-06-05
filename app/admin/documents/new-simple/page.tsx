"use client"

import React from 'react'
import SimpleDocumentForm from '@/components/simple-document-form'
import { useRouter } from 'next/navigation'

export default function NewDocumentPage() {
  const router = useRouter()

  const handleSuccess = (document: any) => {
    console.log('✅ Documento creado exitosamente:', document)
    // Opcional: redirigir después de crear
    // router.push('/admin/documents')
  }

  const handleCancel = () => {
    router.push('/admin/documents')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Nuevo Documento</h1>
        <p className="text-gray-600 mt-2">
          Agrega un nuevo documento a la biblioteca digital
        </p>
      </div>
      
      <SimpleDocumentForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
