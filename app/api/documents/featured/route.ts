import { type NextRequest, NextResponse } from "next/server"
import { documentService } from "@/lib/document-service-r2"
import { handleCors, withCors } from '@/lib/cors'
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter'

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  return withRateLimit(apiRateLimiter)(request, async () => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "6")

    const cacheKey = CACHE_KEYS.DOCUMENTS_FEATURED(limit);
    const documents = await withCache(
      cacheKey,
      () => documentService.getFeaturedDocuments(limit),
      CACHE_TTL.LONG // Cache más largo para documentos destacados
    );

    return withCors(NextResponse.json({ documents }), request)
  } catch (error) {
    console.error("Error fetching featured documents:", error)
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request)
  }
  });
}
