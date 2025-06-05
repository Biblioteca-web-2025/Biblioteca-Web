interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  message: string
  responseTime?: number
  lastChecked: string
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded'
  services: {
    supabase: ServiceHealth
    r2: ServiceHealth
    database: ServiceHealth
    auth: ServiceHealth
  }
}

export async function validateSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now()
  
  const services = {
    supabase: await checkSupabaseHealth(),
    r2: await checkR2Health(),
    database: await checkDatabaseHealth(),
    auth: await checkAuthHealth()
  }

  // Determinar estado general
  const unhealthyServices = Object.values(services).filter(s => s.status === 'unhealthy')
  const degradedServices = Object.values(services).filter(s => s.status === 'degraded')

  let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
  if (unhealthyServices.length > 0) {
    overall = 'unhealthy'
  } else if (degradedServices.length > 0) {
    overall = 'degraded'
  }

  return {
    overall,
    services
  }
}

async function checkSupabaseHealth(): Promise<ServiceHealth> {
  try {
    const startTime = Date.now()
    
    // Verificar conexión básica
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        status: 'unhealthy',
        message: 'Variables de entorno de Supabase no configuradas',
        lastChecked: new Date().toISOString()
      }
    }

    // Intentar importar dinámicamente supabase
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Hacer una consulta simple
    const { data, error } = await supabase
      .from('documents')
      .select('count', { count: 'exact', head: true })

    const responseTime = Date.now() - startTime

    if (error) {
      return {
        status: 'unhealthy',
        message: `Error de Supabase: ${error.message}`,
        responseTime,
        lastChecked: new Date().toISOString()
      }
    }

    return {
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      message: `Supabase conectado. ${data ? 'Datos disponibles' : 'Sin datos'}`,
      responseTime,
      lastChecked: new Date().toISOString()
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Error al conectar con Supabase: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkR2Health(): Promise<ServiceHealth> {
  try {
    const startTime = Date.now()

    // Verificar variables de entorno
    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return {
        status: 'unhealthy',
        message: 'Variables de entorno de R2 no configuradas',
        lastChecked: new Date().toISOString()
      }
    }

    // Intentar importar dinámicamente AWS SDK
    const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3')
    
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    })

    // Verificar acceso al bucket
    await s3Client.send(new HeadBucketCommand({
      Bucket: process.env.R2_BUCKET
    }))

    const responseTime = Date.now() - startTime

    return {
      status: responseTime > 3000 ? 'degraded' : 'healthy',
      message: `R2 bucket accesible (${process.env.R2_BUCKET})`,
      responseTime,
      lastChecked: new Date().toISOString()
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Error al acceder a R2: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkDatabaseHealth(): Promise<ServiceHealth> {
  try {
    const startTime = Date.now()

    // Verificar que las tablas principales existan
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar tablas principales
    const tables = ['documents', 'document_stats', 'admin_users', 'activity_logs']
    const tableChecks = await Promise.allSettled(
      tables.map(table => 
        supabase.from(table).select('count', { count: 'exact', head: true })
      )
    )

    const failedTables = tableChecks
      .map((result, index) => ({ result, table: tables[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ table }) => table)

    const responseTime = Date.now() - startTime

    if (failedTables.length > 0) {
      return {
        status: 'unhealthy',
        message: `Tablas faltantes o inaccesibles: ${failedTables.join(', ')}`,
        responseTime,
        lastChecked: new Date().toISOString()
      }
    }

    return {
      status: 'healthy',
      message: `Todas las tablas disponibles (${tables.length} verificadas)`,
      responseTime,
      lastChecked: new Date().toISOString()
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Error en verificación de base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkAuthHealth(): Promise<ServiceHealth> {
  try {
    const startTime = Date.now()

    if (!process.env.JWT_SECRET) {
      return {
        status: 'unhealthy',
        message: 'JWT_SECRET no configurado',
        lastChecked: new Date().toISOString()
      }
    }

    // Verificar que se puede crear un token JWT
    const jwt = await import('jsonwebtoken')
    const testPayload = { test: true, exp: Math.floor(Date.now() / 1000) + 60 }
    const token = jwt.default.sign(testPayload, process.env.JWT_SECRET)
    
    // Verificar que se puede decodificar
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET)

    const responseTime = Date.now() - startTime

    return {
      status: 'healthy',
      message: 'Sistema de autenticación JWT funcional',
      responseTime,
      lastChecked: new Date().toISOString()
    }

  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Error en sistema de autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastChecked: new Date().toISOString()
    }
  }
}