// Helper functions for token validation and authentication
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  exp?: number;
  sub?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Validates a JWT token's format and expiration
 * @param token The JWT token to validate
 * @returns Object with validation result and decoded token payload
 */
export const validateToken = (token: string): { valid: boolean; payload?: DecodedToken; error?: string } => {
  try {    // Check basic JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Decode the token (without verification - we're just checking format and expiration)
    let decoded: DecodedToken;
    
    try {
      decoded = jwtDecode(token);
    } catch (e) {
      return { valid: false, error: 'Failed to decode token' };
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { valid: false, payload: decoded, error: 'Token expired' };
    }

    // Token passes basic validation
    return { valid: true, payload: decoded };  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Gets the authentication token from storage with fallbacks
 * @returns The token or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try localStorage first, then sessionStorage as a fallback
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    
    // Log token presence without exposing the actual token
    if (token) {
      console.log('Token encontrado en almacenamiento');
    } else {
      console.warn('No se encontró token en almacenamiento');
    }
    
    return token;
  }
  return null;
};

/**
 * Removes the authentication token from storage and redirects if needed
 */
export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('token-expiry');
    sessionStorage.removeItem('auth-token');
    console.log('Tokens de autenticación eliminados');
  }
};
