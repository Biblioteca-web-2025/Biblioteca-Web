import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Middleware para verificar la autenticación del usuario en rutas de API
 * 
 * @param {NextRequest} req - Solicitud entrante
 * @param {Function} handler - Función a ejecutar si el usuario está autenticado
 * @returns {Promise<NextResponse>} - Respuesta de la API
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, token: string, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extraer el token de autorización de las cabeceras
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No hay token de autenticación' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Crear cliente de Supabase
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar el token
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Error de autenticación:', error);
      return NextResponse.json({ 
        error: 'Token de autenticación inválido',
        message: error?.message || 'Usuario no autenticado'
      }, { status: 401 });
    }
    
    // Verificar si el usuario es administrador
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', data.user.id)
      .single();
      
    if (adminError || !adminUser) {
      return NextResponse.json({ 
        error: 'No tiene permisos de administrador',
        message: adminError?.message || 'Usuario no autorizado'
      }, { status: 403 });
    }
    
    // Ejecutar el controlador con el token y el ID de usuario validados
    return await handler(req, token, data.user.id);
    
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return NextResponse.json({ 
      error: 'Error de servidor en autenticación',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
