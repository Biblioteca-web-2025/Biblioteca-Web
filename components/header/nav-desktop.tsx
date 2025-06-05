"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "General", href: "/" },
  { name: "Artículos", href: "/articulos" },
  { name: "Proyectos", href: "/proyectos" },
  { name: "Trabajo de grado", href: "/trabajo-de-grado" },
  { name: "Fichas", href: "/fichas" },
  { name: "Libros", href: "/libros" },
  { name: "Otros", href: "/otras-publicaciones" },
]

export function NavDesktop() {
  const pathname = usePathname()
  const linkBaseClass = "text-base font-medium transition-all duration-200 relative py-2 px-1"

  return (
    <nav className="hidden md:flex items-center gap-10" role="navigation" aria-label="Navegación principal">
      {navItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            linkBaseClass,
            pathname === item.href
              ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white after:rounded-full"
              : "text-white/80 hover:text-white hover:scale-105",
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
