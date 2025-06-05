// Rate Limiter para controlar la frecuencia de requests
import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Ventana de tiempo en ms
  maxRequests: number; // Máximo de requests por ventana
  keyGenerator?: (req: NextRequest) => string; // Función para generar la key
}

// Almacén en memoria para rate limiting (en producción usar Redis)
const requestStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => req.ip || 'anonymous',
      ...config
    };
  }

  async checkLimit(request: NextRequest): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const key = this.config.keyGenerator!(request);
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Limpiar entradas expiradas
    for (const [k, v] of requestStore.entries()) {
      if (v.resetTime <= now) {
        requestStore.delete(k);
      }
    }

    let entry = requestStore.get(key);
    
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    entry.count++;
    requestStore.set(key, entry);

    const allowed = entry.count <= this.config.maxRequests;
    
    return {
      allowed,
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime
    };
  }
}

// Rate limiters pre-configurados
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100 // 100 requests por 15 minutos
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 50 // Much more lenient - 50 attempts per 15 minutes
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 20 // 20 uploads por hora
});

// Middleware helper para aplicar rate limiting
export function withRateLimit(rateLimiter: RateLimiter) {
  return async (request: NextRequest, handler: Function) => {
    const result = await rateLimiter.checkLimit(request);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

    // Agregar headers de rate limit a la respuesta
    const response = await handler();
    
    if (response && response.headers) {
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    }

    return response;
  };
}
