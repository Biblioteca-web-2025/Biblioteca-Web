import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Configuración de cookies
const COOKIE_CONFIG = {
  name: 'biblioteca-auth',
  maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

interface AuthSession {
  userId: string;
  email: string;
  role: string;
  fullName: string;
  expiresAt: number;
}

export class AuthManager {
  private jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
  }

  // Crear token de sesión
  createSessionToken(user: {
    id: string;
    email: string;
    role: string;
    full_name: string;
  }): string {
    const expiresAt = Date.now() + (COOKIE_CONFIG.maxAge * 1000);
    
    const payload: AuthSession = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      expiresAt
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: COOKIE_CONFIG.maxAge
    });
  }

  // Validar token de sesión
  validateSessionToken(token: string): AuthSession | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthSession;
      
      // Verificar que no haya expirado
      if (decoded.expiresAt < Date.now()) {
        return null;
      }
      
      return decoded;
    } catch (error) {
      console.error('Error validating session token:', error);
      return null;
    }
  }

  // Crear cookie de sesión
  createSessionCookie(token: string): string {
    const expires = new Date(Date.now() + (COOKIE_CONFIG.maxAge * 1000));
    
    return [
      `${COOKIE_CONFIG.name}=${token}`,
      `Max-Age=${COOKIE_CONFIG.maxAge}`,
      `Expires=${expires.toUTCString()}`,
      `Path=${COOKIE_CONFIG.path}`,
      COOKIE_CONFIG.httpOnly ? 'HttpOnly' : '',
      COOKIE_CONFIG.secure ? 'Secure' : '',
      `SameSite=${COOKIE_CONFIG.sameSite}`
    ].filter(Boolean).join('; ');
  }

  // Obtener sesión desde request
  getSessionFromRequest(request: NextRequest): AuthSession | null {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const cookies = this.parseCookies(cookieHeader);
    const token = cookies[COOKIE_CONFIG.name];
    
    if (!token) return null;
    
    return this.validateSessionToken(token);
  }

  // Crear cookie de logout
  createLogoutCookie(): string {
    return [
      `${COOKIE_CONFIG.name}=`,
      'Max-Age=0',
      'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      `Path=${COOKIE_CONFIG.path}`
    ].join('; ');
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
    
    return cookies;
  }

  // Verificar si la sesión expira pronto (renovar automáticamente)
  shouldRenewSession(session: AuthSession): boolean {
    const timeUntilExpiry = session.expiresAt - Date.now();
    const renewThreshold = 24 * 60 * 60 * 1000; // 24 horas
    
    return timeUntilExpiry < renewThreshold;
  }
}

// Instancia global
export const authManager = new AuthManager();

// Helper para respuestas con cookies
export function withAuthCookie(response: NextResponse, token: string): NextResponse {
  const cookieString = authManager.createSessionCookie(token);
  response.headers.set('Set-Cookie', cookieString);
  return response;
}

export function withLogoutCookie(response: NextResponse): NextResponse {
  const cookieString = authManager.createLogoutCookie();
  response.headers.set('Set-Cookie', cookieString);
  return response;
}
