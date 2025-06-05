// Configuración para Cloudflare D1 y R2 según documentación oficial
import type { D1Database } from "@cloudflare/workers-types"
import type { R2Bucket } from "@cloudflare/workers-types"

export interface CloudflareEnv {
  DB: D1Database
  BUCKET: R2Bucket
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
}

// Tipos para la base de datos
export interface Document {
  id: string
  title: string
  author: string
  category: string
  subcategory?: string
  year: string
  cover_image_url?: string
  pdf_url?: string
  type: string
  description?: string
  keywords?: string
  editorial?: string
  isbn?: string
  pages?: number
  location?: string
  created_at: string
  updated_at: string
}

export interface DocumentStats {
  id: number
  document_id: string
  views: number
  downloads: number
  last_viewed?: string
}

export interface ActivityLog {
  id: number
  action: string
  document_id?: string
  user_ip?: string
  user_agent?: string
  timestamp: string
}

// Service para trabajar con D1 Database
export class DocumentService {
  constructor(private db: D1Database) {}

  async getAllDocuments(): Promise<Document[]> {
    const { results } = await this.db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all()
    return results as Document[]
  }

  async getDocumentsByType(type: string): Promise<Document[]> {
    const { results } = await this.db
      .prepare("SELECT * FROM documents WHERE type = ? ORDER BY created_at DESC")
      .bind(type)
      .all()
    return results as Document[]
  }

  async getDocumentById(id: string): Promise<Document | null> {
    const result = await this.db.prepare("SELECT * FROM documents WHERE id = ?").bind(id).first()
    return result as Document | null
  }

  async createDocument(document: Omit<Document, "id" | "created_at" | "updated_at">): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    await this.db
      .prepare(`
      INSERT INTO documents (
        id, title, author, category, subcategory, year, 
        cover_image_url, pdf_url, type, description, keywords, 
        editorial, isbn, pages, location, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        id,
        document.title,
        document.author,
        document.category,
        document.subcategory,
        document.year,
        document.cover_image_url,
        document.pdf_url,
        document.type,
        document.description,
        document.keywords,
        document.editorial,
        document.isbn,
        document.pages,
        document.location,
        now,
        now,
      )
      .run()

    return id
  }

  async updateDocument(id: string, document: Partial<Document>): Promise<void> {
    const now = new Date().toISOString()

    const fields = Object.keys(document).filter((key) => key !== "id" && key !== "created_at")
    const setClause = fields.map((field) => `${field} = ?`).join(", ")
    const values = fields.map((field) => document[field as keyof Document])

    await this.db
      .prepare(`
      UPDATE documents SET ${setClause}, updated_at = ? WHERE id = ?
    `)
      .bind(...values, now, id)
      .run()
  }

  async deleteDocument(id: string): Promise<void> {
    await this.db.prepare("DELETE FROM documents WHERE id = ?").bind(id).run()
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const searchTerm = `%${query}%`
    const { results } = await this.db
      .prepare(`
      SELECT * FROM documents 
      WHERE title LIKE ? OR author LIKE ? OR description LIKE ? OR keywords LIKE ?
      ORDER BY 
        CASE 
          WHEN title LIKE ? THEN 1
          WHEN author LIKE ? THEN 2
          WHEN keywords LIKE ? THEN 3
          ELSE 4
        END,
        created_at DESC
    `)
      .bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
      .all()

    return results as Document[]
  }

  async getFeaturedDocuments(type?: string, limit = 12): Promise<Document[]> {
    let query = "SELECT * FROM documents WHERE 1=1"
    const params: any[] = []

    if (type && type !== "all") {
      query += " AND type = ?"
      params.push(type)
    }

    query += " ORDER BY created_at DESC LIMIT ?"
    params.push(limit)

    const { results } = await this.db
      .prepare(query)
      .bind(...params)
      .all()
    return results as Document[]
  }

  async incrementViews(documentId: string): Promise<void> {
    const now = new Date().toISOString()

    await this.db
      .prepare(`
      INSERT INTO document_stats (document_id, views, last_viewed)
      VALUES (?, 1, ?)
      ON CONFLICT(document_id) DO UPDATE SET
        views = views + 1,
        last_viewed = ?
    `)
      .bind(documentId, now, now)
      .run()
  }

  async getDocumentStats(documentId: string): Promise<DocumentStats | null> {
    const result = await this.db.prepare("SELECT * FROM document_stats WHERE document_id = ?").bind(documentId).first()
    return result as DocumentStats | null
  }

  // Método logActivity removido - ya no se usa activity_logs
}

// Service para trabajar con R2 Storage
export class FileService {
  constructor(private bucket: R2Bucket) {}

  async uploadFile(file: File, path: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer()

    await this.bucket.put(path, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000",
      },
    })

    return path
  }

  async deleteFile(path: string): Promise<void> {
    await this.bucket.delete(path)
  }

  async getFileUrl(path: string): Promise<string> {
    // Retorna la URL pública configurada en R2
    return `${process.env.R2_PUBLIC_URL}/${path}`
  }

  generateFilePath(type: "cover" | "pdf", filename: string): string {
    const timestamp = Date.now()
    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_")
    return `${type}s/${timestamp}_${sanitizedName}`
  }
}

// Helper para obtener el entorno de Cloudflare en diferentes contextos
export function getCloudflareEnv(): CloudflareEnv {
  // En Cloudflare Workers/Pages, las variables están disponibles globalmente
  // Esta función se adaptará según el contexto de ejecución
  if (typeof globalThis !== "undefined" && "DB" in globalThis && "BUCKET" in globalThis) {
    return globalThis as unknown as CloudflareEnv
  }

  throw new Error("Cloudflare environment not available")
}
