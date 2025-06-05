import { NextRequest, NextResponse } from 'next/server';
import { R2Service } from '@/lib/r2-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Se requiere una URL para verificar' },
        { status: 400 }
      );
    }

    // Extraer la clave del archivo desde la URL
    const fileKey = R2Service.extractKeyFromUrl(url);
    
    // Verificar si el archivo existe en R2
    const exists = await R2Service.fileExists(fileKey);
    
    if (exists) {
      // Si existe, obtener información adicional
      const fileInfo = await R2Service.getFileInfo(fileKey);
      
      return NextResponse.json({
        exists,
        fileKey,
        fileInfo,
        publicUrl: url,
      });
    } else {
      return NextResponse.json({
        exists,
        fileKey,
        error: 'El archivo no existe en R2'
      });
    }
  } catch (error) {
    console.error('❌ Error verificando archivo en R2:', error);
    return NextResponse.json(
      { 
        error: 'Error verificando archivo en R2',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
