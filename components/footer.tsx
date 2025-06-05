"use client"

import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="max-w-screen-xl mx-auto px-8 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-medium text-xl">Biblioteca Digital</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              Una plataforma educativa para compartir y acceder a recursos académicos de calidad.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="font-medium mb-3">Recursos</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/articulos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Artículos
                  </a>
                </li>
                <li>
                  <a
                    href="/trabajo-de-grado"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Trabajo de grado
                  </a>
                </li>
                <li>
                  <a href="/fichas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Fichas
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Privacidad
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t mt-12 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Biblioteca Digital. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
