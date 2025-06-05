import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { R2Service } from '@/lib/r2-client'

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: {} as Record<string, any>
  }

  // 1. Verificar variables de entorno
  results.tests.environment = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    r2Endpoint: !!process.env.R2_ENDPOINT,
    r2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
    r2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    r2Bucket: !!process.env.R2_BUCKET,
    values: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      r2Endpoint: process.env.R2_ENDPOINT?.substring(0, 50) + '...',
      r2Bucket: process.env.R2_BUCKET
    }
  }
  // 2. Probar conexión a Supabase
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }
    
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('count')
      .limit(1)

    results.tests.supabase = {
      connected: !error,
      error: error?.message,
      canQuery: !!data
    }
  } catch (error) {
    results.tests.supabase = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  // 3. Probar R2 - crear archivo de prueba
  try {
    const testKey = `test/connection-test-${Date.now()}.txt`
    const testContent = 'Test connection to R2'
    
    const uploadResult = await R2Service.uploadFile(
      Buffer.from(testContent),
      testKey,
      'text/plain',
      { test: 'true' }
    )

    // Intentar eliminar el archivo de prueba
    await R2Service.deleteFile(testKey)

    results.tests.r2 = {
      connected: true,
      uploadSuccess: !!uploadResult,
      uploadUrl: uploadResult,
      deleteSuccess: true
    }
  } catch (error) {
    results.tests.r2 = {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
  // 4. Verificar tabla de documentos
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }
    
    const { data: tableInfo } = await supabaseAdmin
      .from('documents')
      .select('*')
      .limit(1)

    results.tests.documentsTable = {
      exists: true,
      canSelect: !!tableInfo,
      sampleRecord: tableInfo?.[0] || null
    }
  } catch (error) {
    results.tests.documentsTable = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
  // 5. Verificar tabla de admin_users
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }
    
    const { data: adminUsers } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, role, is_active')
      .limit(3)

    results.tests.adminUsers = {
      exists: true,
      count: adminUsers?.length || 0,
      users: adminUsers || []
    }
  } catch (error) {
    results.tests.adminUsers = {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }

  return NextResponse.json(results, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    // Prueba completa de upload
    const formData = await request.formData()
    const testFile = formData.get('testFile') as File
    
    if (!testFile) {
      return NextResponse.json({ error: 'No test file provided' }, { status: 400 })
    }

    const results = {
      timestamp: new Date().toISOString(),
      uploadTest: {} as any
    }

    // 1. Subir archivo a R2
    const fileKey = `test-uploads/test-${Date.now()}-${testFile.name}`
    const fileBuffer = await testFile.arrayBuffer()
    
    const uploadUrl = await R2Service.uploadFile(
      new Uint8Array(fileBuffer),
      fileKey,
      testFile.type,
      {
        'original-name': testFile.name,
        'test-upload': 'true'
      }
    )

    results.uploadTest.r2Upload = {
      success: true,
      url: uploadUrl,
      fileKey: fileKey,
      fileSize: testFile.size
    }    // 2. Crear registro en Supabase
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized')
    }
    
    const { data: document, error } = await supabaseAdmin
      .from('documents')
      .insert({
        title: `Test Upload - ${new Date().toLocaleString()}`,
        author: 'Sistema de Pruebas',
        description: 'Documento de prueba para verificar funcionalidad',
        type: 'test',
        category: 'testing',
        year: new Date().getFullYear().toString(),
        file_url: uploadUrl,
        file_name: testFile.name,
        file_size: testFile.size,
        featured: false,
        created_by: 'system-test'
      })
      .select()
      .single()

    if (error) {
      results.uploadTest.supabaseInsert = {
        success: false,
        error: error.message
      }
      
      // Limpiar archivo de R2 si falló la inserción
      await R2Service.deleteFile(fileKey)
    } else {
      results.uploadTest.supabaseInsert = {
        success: true,
        documentId: document.id,
        document: document
      }
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
