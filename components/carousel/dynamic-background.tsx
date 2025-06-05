"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface DynamicBackgroundProps {
  backgroundImage: string
  dominantColor: string
  currentIndex: number
}

export function DynamicBackground({ backgroundImage, dominantColor, currentIndex }: DynamicBackgroundProps) {
  return (
    <div className="absolute inset-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={backgroundImage || "/placeholder.svg"}
            alt="Fondo dinámico del carrusel"
            fill
            className="object-cover blur-sm"
            priority
            sizes="100vw"
          />
          {/* Gradiente lineal principal */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
          {/* Efecto de viñeta radial */}
          <div
            className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.7) 100%)",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
