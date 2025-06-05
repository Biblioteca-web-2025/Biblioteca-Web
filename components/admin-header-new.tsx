"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { BookOpen, Menu } from "lucide-react"
import { useState } from "react"
import { UserMenu } from "@/components/user-menu"

export function AdminHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo y navegación */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="hidden font-semibold sm:inline-block">
              Admin Biblioteca
            </span>
          </Link>
        </div>

        {/* Acciones de la derecha */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <UserMenu />
          
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
