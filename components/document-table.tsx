"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Eye, MoreHorizontal, Trash, Download } from "lucide-react"
import Link from "next/link"
import { useDeleteDocument } from "@/hooks/use-documents-complete"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

interface DocumentTableProps {
  documents?: any[]
  onDocumentDeleted?: () => void // Callback para actualizar la lista después de eliminar
}

export function DocumentTable({ documents: providedDocuments, onDocumentDeleted }: DocumentTableProps) {
  const [filteredDocuments, setFilteredDocuments] = useState(providedDocuments || [])
  const [currentFilter, setCurrentFilter] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    documentId: string
    documentTitle: string
  }>({
    open: false,
    documentId: '',
    documentTitle: ''
  })
  
  // Hook para eliminar documentos
  const { deleteDocument, loading: deleteLoading, error: deleteError } = useDeleteDocument()

  // Usar los documentos proporcionados o los predeterminados
  useEffect(() => {
    if (providedDocuments && providedDocuments.length > 0) {
      setFilteredDocuments(providedDocuments)
    } else if (!providedDocuments) {
      // Si no se proporcionan documentos, mostrar array vacío
      setFilteredDocuments([])
    }
  }, [providedDocuments])

  // Escuchar cambios de filtro desde el sidebar
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const filterType = event.detail.filterType
      setCurrentFilter(filterType)

      // Si hay documentos paginados, no aplicar filtro adicional
      if (providedDocuments && providedDocuments.length > 0) {
        return
      }

      // Los filtros ahora se manejan en el componente padre
      // que obtiene los documentos de la base de datos
    }

    window.addEventListener("filterChange", handleFilterChange as EventListener)

    return () => {
      window.removeEventListener("filterChange", handleFilterChange as EventListener)
    }
  }, [providedDocuments])

  // Función para abrir el diálogo de confirmación
  const openDeleteDialog = (documentId: string, documentTitle: string) => {
    setDeleteDialog({
      open: true,
      documentId,
      documentTitle
    })
  }

  // Función para cerrar el diálogo
  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      documentId: '',
      documentTitle: ''
    })
  }

  // Función para manejar la eliminación de documentos
  const handleDelete = async () => {
    const { documentId, documentTitle } = deleteDialog
    console.log('🗑️ Eliminando documento:', documentId, documentTitle)

    try {
      setDeletingId(documentId)
      closeDeleteDialog() // Cerrar el diálogo inmediatamente
      
      console.log('🔄 Iniciando eliminación...')
      await deleteDocument(documentId)
      
      console.log('✅ Documento eliminado exitosamente')
      
      // Actualizar la lista local
      setFilteredDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Notificar al componente padre
      if (onDocumentDeleted) {
        onDocumentDeleted()
      }
      
      // Mostrar mensaje de éxito
      toast.success(`El documento "${documentTitle}" ha sido eliminado exitosamente.`)
      
    } catch (error) {
      console.error('❌ Error al eliminar documento:', error)
      toast.error(
        error instanceof Error ? error.message : "No se pudo eliminar el documento"
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Año</TableHead>
            <TableHead>Archivo</TableHead>
            <TableHead className="w-[100px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((doc) => (
            <TableRow 
              key={doc.id} 
              className={deletingId === doc.id ? "opacity-50 pointer-events-none" : ""}
            >
              <TableCell className="font-medium max-w-xs truncate">
                {doc.title}
                {deletingId === doc.id && (
                  <span className="ml-2 text-xs text-muted-foreground">(Eliminando...)</span>
                )}
              </TableCell>
              <TableCell>{doc.author}</TableCell>
              <TableCell>{doc.category}</TableCell>
              <TableCell>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {doc.type === "trabajo-de-grado"
                    ? "Trabajo de grado"
                    : doc.type === "otras-publicaciones"
                      ? "Otros"
                      : doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                </span>
              </TableCell>
              <TableCell>{doc.year}</TableCell>
              <TableCell>
                {doc.file_url ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-green-600">✓ Disponible</span>
                    {doc.file_size && (
                      <span className="text-xs text-muted-foreground">
                        ({(doc.file_size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-red-600">✗ No disponible</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      disabled={deletingId === doc.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link 
                        href={`/documents/${doc.id}`} 
                        className="flex items-center w-full"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver documento
                      </Link>
                    </DropdownMenuItem>
                    {doc.file_url && (
                      <DropdownMenuItem>
                        <a 
                          href={doc.file_url}
                          className="flex items-center w-full"
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar archivo
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Link 
                        href={`/admin/documents/${doc.id}`} 
                        className="flex items-center w-full"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => openDeleteDialog(doc.id, doc.title)}
                      disabled={deletingId === doc.id}
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      {deletingId === doc.id ? "Eliminando..." : "Eliminar"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {currentFilter === "all" 
            ? "No hay documentos disponibles." 
            : "No se encontraron documentos para el filtro seleccionado."
          }
        </div>
      )}

      {/* Mostrar estado de eliminación global si hay algún error */}
      {deleteError && (
        <div className="text-center py-4 text-red-600 text-sm">
          Error: {deleteError}
        </div>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar el documento "{deleteDialog.documentTitle}"? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={closeDeleteDialog}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
