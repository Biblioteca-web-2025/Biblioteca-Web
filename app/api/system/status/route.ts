import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats } from '@/lib/usage-monitor';
import { getConfig } from '@/lib/api-config';
import { appCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas de uso
    const usageStats = await getUsageStats();
    
    // Obtener configuración actual
    const config = getConfig();
    
    // Estadísticas de cache
    const cacheStats = {
      // Estas serían métricas reales del cache
      entries: 'N/A', // appCache.size si tuviera ese método
      hitRate: 'N/A',
      memoryUsage: process.memoryUsage()
    };
    
    // Verificar estado de servicios
    const services = {
      supabase: await checkSupabaseHealth(),
      r2: await checkR2Health(),
      cache: 'healthy',
      rateLimit: 'active'
    };
    
    const systemHealth = {
      status: Object.values(services).every(s => s === 'healthy') ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.environment,
      services,
      usage: usageStats,
      cache: cacheStats,
      limits: {
        supabase: config.SUPABASE,
        r2: config.R2,
        rateLimit: config.RATE_LIMITS
      }
    };
    
    return NextResponse.json(systemHealth);
    
  } catch (error) {
    console.error('Error getting system status:', error);
    
    return NextResponse.json({
      status: 'error',
      error: 'Failed to get system status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

async function checkSupabaseHealth(): Promise<string> {
  try {
    // Hacer una query simple para verificar conectividad
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`
      }
    });
    
    return response.ok ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkR2Health(): Promise<string> {
  try {
    // Verificar configuración de R2
    const hasConfig = !!(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
    );
    
    return hasConfig ? 'healthy' : 'unhealthy';
  } catch {
    return 'unhealthy';
  }
}
