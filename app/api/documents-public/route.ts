import { NextRequest, NextResponse } from 'next/server';
import { DocumentServiceComplete } from '@/lib/document-service-complete';
import { withCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { apiRateLimiter, withRateLimit } from '@/lib/rate-limiter';

const documentService = new DocumentServiceComplete();

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  return withRateLimit(apiRateLimiter)(request, async () => {
  try {
    console.log('📋 GET /api/documents-public - Obteniendo documentos públicos');
      // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Nuevo: buscar por ID específico
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined; // Agregar soporte para tipo
    const search = searchParams.get('search') || undefined;

    console.log('🔍 Parámetros de búsqueda:', { id, page, limit, category, type, search });
    
    // Log para debugging de búsqueda
    if (search) {
      console.log('🔍 Realizando búsqueda con término:', search);
    }    // Si se proporciona un ID específico, buscar solo ese documento
    if (id) {
      try {
        const cacheKey = CACHE_KEYS.DOCUMENT_BY_ID(id);
        const document = await withCache(
          cacheKey,
          () => documentService.getDocumentById(id),
          CACHE_TTL.MEDIUM
        );
        
        if (!document || document.status !== 'active') {
          return NextResponse.json(
            { error: 'Documento no encontrado' },
            { status: 404 }
          );
        }
        
        // Asegurarse de que las URLs estén completas y sean accesibles públicamente
        if (document.file_url && !document.file_url.startsWith('https://')) {
          // Si la URL no comienza con https://, asegurarse de agregar el dominio público de R2
          if (process.env.R2_PUBLIC_URL) {
            document.file_url = `${process.env.R2_PUBLIC_URL}/${document.file_url}`;
          }
        }
          // Lo mismo para la imagen de portada
        if (document.cover_image_url && !document.cover_image_url.startsWith('https://')) {
          if (process.env.R2_PUBLIC_DOMAIN) {
            document.cover_image_url = `${process.env.R2_PUBLIC_DOMAIN}/${document.cover_image_url}`;
          }
        }

        return NextResponse.json({
          documents: [document],
          total: 1,
          page: 1,
          totalPages: 1
        });
      } catch (error) {
        console.error('❌ Error obteniendo documento por ID:', error);
        return NextResponse.json(
          { error: 'Documento no encontrado' },
          { status: 404 }
        );
      }
    }    // Obtener documentos sin autenticación (incluir todos los documentos por ahora)
    const cacheKey = CACHE_KEYS.DOCUMENTS_PUBLIC(type, page, limit);
    const result = await withCache(
      cacheKey,
      () => documentService.getDocuments({
        page,
        limit,
        category,
        type,  // Agregar soporte para tipo
        search,
        // status: 'active' // Comentado temporalmente para mostrar todos los documentos
      }),
      CACHE_TTL.SHORT // Cache más corto para listas
    );

    console.log('✅ Documentos obtenidos:', result.total);

    return NextResponse.json({
      documents: result.documents,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages    });

  } catch (error) {
    console.error('❌ Error en GET /api/documents-public:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
  }); // Cerrar withRateLimit
}
