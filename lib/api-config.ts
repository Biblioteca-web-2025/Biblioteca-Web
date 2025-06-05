// Configuración de límites y optimización
export const API_LIMITS = {
  // Rate limits por tipo de operación
  RATE_LIMITS: {
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 5 // 5 intentos de login
    },
    API_GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100 // 100 requests generales
    },
    UPLOAD: {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 20 // 20 uploads por hora
    },
    SEARCH: {
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 50 // 50 búsquedas por 5 minutos
    }
  },

  // Configuración de cache
  CACHE: {
    TTL: {
      SHORT: 2 * 60 * 1000,    // 2 minutos
      MEDIUM: 5 * 60 * 1000,   // 5 minutos  
      LONG: 15 * 60 * 1000,    // 15 minutos
      VERY_LONG: 60 * 60 * 1000 // 1 hora
    },
    MAX_ENTRIES: 1000, // Máximo de entradas en cache
    CLEANUP_INTERVAL: 10 * 60 * 1000 // Limpiar cada 10 minutos
  },

  // Configuración de requests
  REQUEST: {
    TIMEOUT: 30 * 1000, // 30 segundos timeout
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1 segundo inicial
    DEBOUNCE_DELAY: 300, // 300ms debounce para búsquedas
    THROTTLE_DELAY: 1000, // 1 segundo throttle
    MAX_CONCURRENT: 3 // Máximo 3 requests concurrentes
  },

  // Límites de Supabase (plan gratuito)
  SUPABASE: {
    REQUESTS_PER_HOUR: 500000,
    REQUESTS_PER_SECOND: 100, // Estimado
    MAX_CONNECTIONS: 60
  },

  // Límites de Cloudflare R2 (plan gratuito)
  R2: {
    CLASS_A_OPERATIONS_MONTH: 1000000, // 1M operaciones/mes
    CLASS_B_OPERATIONS_MONTH: 10000000, // 10M operaciones/mes
    STORAGE_GB_MONTH: 10 // 10GB gratis
  }
};

// Helper para verificar si estamos cerca de los límites
export function checkLimits() {
  const warnings = [];
  
  // Aquí puedes agregar lógica para verificar uso actual
  // vs límites configurados
  
  return {
    hasWarnings: warnings.length > 0,
    warnings
  };
}

// Configuración de optimización automática
export const OPTIMIZATION_CONFIG = {
  // Habilitar optimizaciones
  ENABLE_CACHE: true,
  ENABLE_RATE_LIMITING: true,
  ENABLE_REQUEST_QUEUE: true,
  ENABLE_RETRY: true,
  
  // Configuración de desarrollo vs producción
  DEVELOPMENT: {
    CACHE_TTL_MULTIPLIER: 0.5, // Cache más corto en desarrollo
    RATE_LIMIT_MULTIPLIER: 2, // Límites más altos en desarrollo
    ENABLE_LOGGING: true
  },
  
  PRODUCTION: {
    CACHE_TTL_MULTIPLIER: 1,
    RATE_LIMIT_MULTIPLIER: 1,
    ENABLE_LOGGING: false // Menos logging en producción
  }
};

// Obtener configuración según el entorno
export function getConfig() {
  const isDev = process.env.NODE_ENV === 'development';
  const baseConfig = API_LIMITS;
  const envConfig = isDev ? OPTIMIZATION_CONFIG.DEVELOPMENT : OPTIMIZATION_CONFIG.PRODUCTION;
  
  return {
    ...baseConfig,
    environment: isDev ? 'development' : 'production',
    optimizations: envConfig
  };
}
