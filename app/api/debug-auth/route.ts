import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Endpoint de diagnóstico para depurar problemas de autenticación
 * Solo disponible en entorno de desarrollo
 */
export async function GET(request: NextRequest) {
  // Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint no disponible en producción' }, { status: 403 });
  }
  
  try {
    // Extraer el token de autorización de las cabeceras
    const authHeader = request.headers.get('authorization');
    const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Crear cliente de Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Obtener sesión actual
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Verificar token proporcionado (si hay)
    let tokenValidation = null;
    if (tokenFromHeader) {
      try {
        const { data: tokenData, error: tokenError } = await supabase.auth.getUser(tokenFromHeader);
        tokenValidation = {
          valid: !!tokenData?.user && !tokenError,
          errorMessage: tokenError?.message,
          user: tokenData?.user ? {
            id: tokenData.user.id,
            email: tokenData.user.email
          } : null
        };
      } catch (e) {
        tokenValidation = {
          valid: false,
          errorMessage: e instanceof Error ? e.message : 'Error desconocido',
        };
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      auth: {
        sessionPresent: !!sessionData?.session,
        tokenFromHeader: !!tokenFromHeader,
        tokenValidation
      },
      session: sessionData?.session ? {
        userId: sessionData.session.user?.id,
        email: sessionData.session.user?.email,
        expiresAt: sessionData.session.expires_at
      } : null
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error en el diagnóstico de autenticación',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
