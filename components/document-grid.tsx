"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { BookOpen, Eye, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

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

interface DocumentGridProps {
  documents: Document[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

export function DocumentGrid({ documents }: DocumentGridProps) {
  const handleDownload = (fileUrl: string, title: string) => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `${title}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePreview = (fileUrl: string) => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  // Si no hay resultados, mostrar mensaje
  if (documents.length === 0) {
    return (
      <motion.div
        className="text-center py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          No se encontraron documentos
        </h3>
        <p className="text-sm text-muted-foreground">
          Intenta ajustar los filtros o realizar una búsqueda diferente.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {documents.map((doc) => (
        <motion.div key={doc.id} variants={item}>
          <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300 group cursor-pointer">
            <CardContent className="p-4 flex-1">
              <Link href={`/documents/${doc.id}`} className="block">
                <div className="aspect-[3/4] relative mb-4 bg-muted rounded-md overflow-hidden group-hover:scale-105 transition-transform duration-300">
                {doc.cover_image_url ? (
                  <Image
                    src={doc.cover_image_url}
                    alt={`Portada de ${doc.title}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                    <BookOpen className="h-16 w-16 text-blue-600 dark:text-blue-300" />
                  </div>
                )}
              </div>
              </Link>
              
              <div className="space-y-2">
                <Link href={`/documents/${doc.id}`}>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                    {doc.title}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {doc.author}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                    {doc.category}
                  </span>
                  <span className="text-muted-foreground">
                    {doc.year}
                  </span>
                </div>
                
                {doc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {doc.description}
                  </p>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0 flex gap-2">
              <Link href={`/documents/${doc.id}`} className="flex-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver detalles
                </Button>
              </Link>
              {doc.file_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePreview(doc.file_url!)}
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Leer
                </Button>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  )
}
