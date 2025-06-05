"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Book } from "@/types/book"

interface BookInfoProps {
  book: Book
  currentIndex: number
}

export function BookInfo({ book, currentIndex }: BookInfoProps) {
  return (
    <motion.div
      key={`info-${currentIndex}`}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="text-white space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{book.title}</h1>
        <span className="inline-block px-3 py-1 bg-primary/20 backdrop-blur-sm rounded-full text-sm font-medium">
          {book.category}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm" role="group" aria-label="Información del libro">
        <span>{book.year}</span>
        <span aria-hidden="true">•</span>
        <span>{book.author}</span>
      </div>

      <p className="text-gray-200 text-lg leading-relaxed max-w-2xl">{book.description}</p>

      <div className="flex gap-4">
        <Link href={`/documents/${book.id}`} aria-label={`Leer ${book.title}`}>
          <Button size="lg" className="bg-white text-black hover:bg-gray-200 font-semibold">
            <BookOpen className="h-5 w-5 mr-2" aria-hidden="true" />
            Leer ahora
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}
