import { NextRequest, NextResponse } from 'next/server'

// Configuración CORS para las APIs
const corsOptions = {
  allowedOrigins: [
    'http://localhost:3000',
    'https://*.vercel.app',
    'https://*.netlify.app',
    // Agregar aquí el dominio de producción
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  maxAge: 86400, // 24 horas
}

export function corsHeaders(origin?: string | null) {
  const isAllowedOrigin = !origin || 
    corsOptions.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        return origin.includes(allowedOrigin.replace('*', ''))
      }
      return origin === allowedOrigin
    })

  const headers = new Headers()
  
  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  
  headers.set('Access-Control-Allow-Methods', corsOptions.allowedMethods.join(', '))
  headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '))
  headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString())
  headers.set('Access-Control-Allow-Credentials', 'true')

  return headers
}

export function handleCors(request: NextRequest) {
  const origin = request.headers.get('origin')
  
  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: corsHeaders(origin),
    })
  }

  return null
}

export function withCors(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)
  
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })
  
  return response
}
