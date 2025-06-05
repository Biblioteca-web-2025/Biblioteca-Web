// Sistema de cache simple para reducir queries a Supabase
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en ms
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si el cache ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Limpiar entradas expiradas
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache global para la aplicación
export const appCache = new SimpleCache();

// Limpiar cache cada 10 minutos
setInterval(() => {
  appCache.cleanup();
}, 10 * 60 * 1000);

// Helper para queries con cache
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutos por defecto
): Promise<T> {
  // Intentar obtener del cache
  const cached = appCache.get<T>(key);
  if (cached !== null) {
    console.log(`📋 Cache hit for key: ${key}`);
    return cached;
  }

  // Si no está en cache, ejecutar query
  console.log(`🔍 Cache miss for key: ${key}, executing query...`);
  const result = await queryFn();
  
  // Guardar en cache
  appCache.set(key, result, ttlMs);
  
  return result;
}

// Keys de cache predefinidas
export const CACHE_KEYS = {
  DOCUMENTS_PUBLIC: (type?: string, page?: number, limit?: number) => 
    `documents:public:${type || 'all'}:${page || 1}:${limit || 10}`,
  
  DOCUMENTS_FEATURED: (limit?: number) => 
    `documents:featured:${limit || 6}`,
  
  DOCUMENT_BY_ID: (id: string) => 
    `document:${id}`,
  
  STATS_GENERAL: () => 
    'stats:general',
  
  ADMIN_USER: (id: string) => 
    `admin:${id}`,
};

// TTL predefinidos (en milisegundos)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,    // 2 minutos
  MEDIUM: 5 * 60 * 1000,   // 5 minutos  
  LONG: 15 * 60 * 1000,    // 15 minutos
  VERY_LONG: 60 * 60 * 1000 // 1 hora
};
