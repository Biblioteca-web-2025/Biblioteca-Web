import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth-utils';
import { DocumentServiceComplete } from '@/lib/document-service-complete';

const documentService = new DocumentServiceComplete();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`📋 GET /api/documents-complete/${id} - Obteniendo documento`);
    
    // Validar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }    const token = authHeader.substring(7);
    const validationResult = validateToken(token);
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Obtener documento
    const document = await documentService.getDocumentById(id);
    
    if (!document) {
      console.log(`❌ Documento no encontrado: ${id}`);
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Documento obtenido: ${document.title}`);
    
    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error(`❌ Error en GET /api/documents-complete/${params}:`, error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`📋 PUT /api/documents-complete/${id} - Actualizando documento`);
    
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

    const userId = validationResult.payload?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 401 }
      );
    }

    // Obtener form data
    const formData = await request.formData();
    
    // Extraer datos del documento
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const newFile = formData.get('file') as File | null;
    const newCoverImage = formData.get('coverImage') as File | null;

    console.log('📄 Datos de actualización:', {
      title,
      description,
      category,
      hasNewFile: !!newFile,
      hasNewCoverImage: !!newCoverImage
    });

    // Validaciones básicas
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: 'Título, descripción y categoría son requeridos' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      title,
      description,
      category
    };

    // Actualizar documento
    const result = await documentService.updateDocumentWithFile(
      id,
      updateData,
      newFile || undefined,
      newFile?.name,
      newFile?.type,
      userId,
      newCoverImage || undefined
    );

    console.log(`✅ Documento actualizado: ${result.title}`);
    
    return NextResponse.json({
      success: true,
      document: result,
      message: 'Documento actualizado exitosamente'
    });

  } catch (error) {
    console.error(`❌ Error en PUT /api/documents-complete/${params}:`, error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`📋 DELETE /api/documents-complete/${id} - Eliminando documento`);
    
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

    const userId = validationResult.payload?.sub;
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 401 }
      );
    }

    // Eliminar documento
    await documentService.deleteDocument(id, userId);

    console.log(`✅ Documento eliminado: ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });

  } catch (error) {
    console.error(`❌ Error en DELETE /api/documents-complete/${params}:`, error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
