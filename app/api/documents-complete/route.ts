import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utils';
import { DocumentServiceComplete } from '@/lib/document-service-complete';

const documentService = new DocumentServiceComplete();

export async function POST(request: NextRequest) {
  try {
    console.log('📋 POST /api/documents-complete - Iniciando creación de documento');
    
    // Validar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ Token de autorización faltante');
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }    const token = authHeader.substring(7);
    const validationResult = validateToken(token);
    
    if (!validationResult.valid) {
      console.log('❌ Token inválido:', validationResult.error);
      return NextResponse.json(
        { error: 'Token inválido', details: validationResult.error },
        { status: 401 }
      );
    }

    const userId = validationResult.payload?.sub;
    if (!userId) {
      console.log('❌ Usuario no encontrado en el token');
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 401 }
      );
    }

    console.log('✅ Usuario autenticado:', userId);

    // Obtener form data
    const formData = await request.formData();
    
    // Extraer datos del documento
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const file = formData.get('file') as File;
    const coverImage = formData.get('coverImage') as File | null;

    console.log('📄 Datos del documento:', {
      title,
      description,
      category,
      fileName: file?.name,
      fileSize: file?.size,
      coverImageName: coverImage?.name,
      coverImageSize: coverImage?.size
    });

    // Validaciones
    if (!title || !description || !category || !file) {
      console.log('❌ Datos requeridos faltantes');
      return NextResponse.json(
        { error: 'Título, descripción, categoría y archivo son requeridos' },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB límite
      console.log('❌ Archivo demasiado grande:', file.size);
      return NextResponse.json(
        { error: 'El archivo no puede superar los 50MB' },
        { status: 400 }
      );
    }

    if (coverImage && coverImage.size > 5 * 1024 * 1024) { // 5MB límite para imagen
      console.log('❌ Imagen de portada demasiado grande:', coverImage.size);
      return NextResponse.json(
        { error: 'La imagen de portada no puede superar los 5MB' },
        { status: 400 }
      );
    }

    // Preparar datos del documento
    const documentData = {
      title,
      description,
      category,
      user_id: userId,
      upload_date: new Date().toISOString(),
      file_size: file.size,
      status: 'active' as const
    };

    // Crear documento con archivo
    console.log('🚀 Creando documento con archivo...');
    const result = await documentService.createDocumentWithFile(
      documentData,
      file,
      file.name,
      file.type,
      userId,
      coverImage || undefined
    );

    console.log('✅ Documento creado exitosamente:', result.id);
    
    return NextResponse.json({
      success: true,
      document: result,
      message: 'Documento creado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en POST /api/documents-complete:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📋 GET /api/documents-complete - Obteniendo documentos');
    
    // Validar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const validationResult = validateToken(token);
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;

    console.log('🔍 Parámetros de búsqueda:', { page, limit, category, type, search });    // Obtener documentos
    const result = await documentService.getDocuments({
      page,
      limit,
      category,
      type,
      search
    });

    console.log(`✅ Obtenidos ${result.documents.length} documentos de ${result.total}`);
    
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Error en GET /api/documents-complete:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
