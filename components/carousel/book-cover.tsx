"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import type { Book } from "@/types/book"

interface BookCoverProps {
  book: Book
  currentIndex: number
}

export function BookCover({ book, currentIndex }: BookCoverProps) {
  return (
    <motion.div
      key={`cover-${currentIndex}`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="flex justify-center lg:justify-start"
    >
      <div className="relative w-80 h-96 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300">
        <div className="absolute -inset-1 bg-transparent group-hover:bg-transparent rounded-2xl group-hover:shadow-[0_0_30px_rgba(59,130,246,0.9),0_0_60px_rgba(59,130,246,0.7),0_0_90px_rgba(59,130,246,0.5)] group-hover:border-2 group-hover:border-blue-400/80 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-pulse"></div>
        <Image
          src={book.coverImage || "/placeholder.svg"}
          alt={`Portada de ${book.title}`}
          fill
          className="object-cover relative z-10"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </motion.div>
  )
}
