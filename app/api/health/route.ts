import { NextRequest, NextResponse } from 'next/server'
import { handleCors, withCors } from '@/lib/cors'
import { validateSystemHealth } from '@/lib/system-validator'

// Manejar OPTIONS request para CORS
export async function OPTIONS(request: NextRequest) {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse
  
  return new NextResponse(null, { status: 405 })
}

export async function GET(request: NextRequest) {
  try {
    // Manejar CORS
    const corsResponse = handleCors(request)
    if (corsResponse) return corsResponse

    // Validar el estado del sistema
    const healthStatus = await validateSystemHealth()
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 503
    
    const response = NextResponse.json({
      status: healthStatus.overall,
      timestamp: new Date().toISOString(),
      services: healthStatus.services,
      summary: {
        total: Object.keys(healthStatus.services).length,
        healthy: Object.values(healthStatus.services).filter(s => s.status === 'healthy').length,
        unhealthy: Object.values(healthStatus.services).filter(s => s.status === 'unhealthy').length
      }
    }, { status: statusCode })

    return withCors(response, request)

  } catch (error) {
    console.error('Health check error:', error)
    
    const errorResponse = NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Failed to perform health check',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })

    return withCors(errorResponse, request)
  }
}