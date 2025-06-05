// Monitor de uso de APIs para prevenir rate limits
import { API_LIMITS } from './api-config';

interface UsageStats {
  requests: number;
  timestamp: number;
  endpoint: string;
  method: string;
  userIp?: string;
}

class APIUsageMonitor {
  private usage: Map<string, UsageStats[]> = new Map();
  private warnings: string[] = [];

  // Registrar una request
  recordRequest(endpoint: string, method: string, userIp?: string) {
    const key = `${method}:${endpoint}`;
    const now = Date.now();
    
    if (!this.usage.has(key)) {
      this.usage.set(key, []);
    }
    
    const stats = this.usage.get(key)!;
    stats.push({
      requests: 1,
      timestamp: now,
      endpoint,
      method,
      userIp
    });
    
    // Limpiar entradas antiguas (más de 1 hora)
    const oneHourAgo = now - (60 * 60 * 1000);
    this.usage.set(key, stats.filter(s => s.timestamp > oneHourAgo));
    
    // Verificar límites
    this.checkLimits(key);
  }

  // Verificar si estamos cerca de los límites
  private checkLimits(key: string) {
    const stats = this.usage.get(key) || [];
    const now = Date.now();
    
    // Verificar límites por hora
    const lastHour = stats.filter(s => s.timestamp > now - (60 * 60 * 1000));
    const requestsLastHour = lastHour.length;
    
    // Verificar límites por minuto
    const lastMinute = stats.filter(s => s.timestamp > now - (60 * 1000));
    const requestsLastMinute = lastMinute.length;
    
    // Alertas
    if (requestsLastHour > API_LIMITS.SUPABASE.REQUESTS_PER_HOUR * 0.8) {
      this.addWarning(`Alto uso en ${key}: ${requestsLastHour} requests en la última hora`);
    }
    
    if (requestsLastMinute > API_LIMITS.SUPABASE.REQUESTS_PER_SECOND * 0.8) {
      this.addWarning(`Alto uso en ${key}: ${requestsLastMinute} requests en el último minuto`);
    }
  }

  private addWarning(message: string) {
    this.warnings.push(`${new Date().toISOString()}: ${message}`);
    console.warn(`⚠️ API Usage Warning: ${message}`);
    
    // Mantener solo las últimas 50 advertencias
    if (this.warnings.length > 50) {
      this.warnings = this.warnings.slice(-50);
    }
  }

  // Obtener estadísticas actuales
  getStats() {
    const now = Date.now();
    const stats: Record<string, any> = {};
    
    for (const [key, requests] of this.usage.entries()) {
      const lastHour = requests.filter(r => r.timestamp > now - (60 * 60 * 1000));
      const lastMinute = requests.filter(r => r.timestamp > now - (60 * 1000));
      
      stats[key] = {
        totalRequests: requests.length,
        requestsLastHour: lastHour.length,
        requestsLastMinute: lastMinute.length,
        avgRequestsPerHour: Math.round(lastHour.length),
        avgRequestsPerMinute: Math.round(lastMinute.length)
      };
    }
    
    return {
      endpoints: stats,
      warnings: this.warnings.slice(-10), // Últimas 10 advertencias
      summary: {
        totalEndpoints: Object.keys(stats).length,
        totalWarnings: this.warnings.length
      }
    };
  }

  // Verificar si deberíamos pausar requests
  shouldThrottle(endpoint: string, method: string): boolean {
    const key = `${method}:${endpoint}`;
    const stats = this.usage.get(key) || [];
    const now = Date.now();
    
    // Verificar requests en el último minuto
    const lastMinute = stats.filter(s => s.timestamp > now - (60 * 1000));
    
    // Si estamos cerca del límite por segundo, throttle
    return lastMinute.length >= API_LIMITS.SUPABASE.REQUESTS_PER_SECOND * 0.9;
  }
}

// Monitor global
export const apiUsageMonitor = new APIUsageMonitor();

// Middleware para Next.js APIs
export function withUsageMonitoring(endpoint: string) {
  return (handler: Function) => {
    return async (request: any, ...args: any[]) => {
      const method = request.method || 'GET';
      const userIp = request.headers.get?.('x-forwarded-for') || 'unknown';
      
      // Registrar la request
      apiUsageMonitor.recordRequest(endpoint, method, userIp);
      
      // Verificar si deberíamos throttle
      if (apiUsageMonitor.shouldThrottle(endpoint, method)) {
        console.warn(`🚦 Throttling request to ${endpoint} - too many requests`);
        
        // Esperar un poco antes de procesar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Ejecutar el handler original
      return handler(request, ...args);
    };
  };
}

// Helper para obtener estadísticas de uso
export async function getUsageStats() {
  return apiUsageMonitor.getStats();
}
