"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, BookOpen, User, Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface BookCardProps {
  book: {
    id: string
    title: string
    author: string
    category: string
    subcategory?: string
    year?: string
    rating?: number
    coverImage: string
    description: string
    featured?: boolean
  }
  className?: string
}

export function BookCard({ book, className }: BookCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm h-full">
        <div className="relative">
          {/* Book Cover */}
          <div className="aspect-[3/4] relative overflow-hidden">
            <Image
              src={book.coverImage || "/placeholder.svg"}
              alt={book.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 text-xs font-medium bg-primary/90 text-white rounded-full backdrop-blur-sm">
                {book.category}
              </span>
            </div>

            {/* Rating */}
            {book.rating && (
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{book.rating}</span>
              </div>
            )}

            {/* Hover Content */}
            <motion.div
              className="absolute inset-0 flex flex-col justify-end p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-white space-y-3">
                <h3 className="font-bold text-lg line-clamp-2">{book.title}</h3>

                <div className="flex items-center gap-2 text-sm opacity-90">
                  <User className="h-4 w-4" />
                  <span>{book.author}</span>
                </div>

                {book.year && (
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Calendar className="h-4 w-4" />
                    <span>{book.year}</span>
                  </div>
                )}

                <p className="text-sm opacity-90 line-clamp-3">{book.description}</p>

                <Link href={`/documents/${book.id}`}>
                  <Button size="sm" className="bg-white/90 text-black hover:bg-white backdrop-blur-sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver documento
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Default Bottom Content */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 p-4 text-white"
              initial={{ opacity: 1 }}
              animate={{ opacity: isHovered ? 0 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
              <p className="text-xs opacity-90">{book.author}</p>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
