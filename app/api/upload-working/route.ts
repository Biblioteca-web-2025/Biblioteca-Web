import { type NextRequest, NextResponse } from "next/server"
import { simpleDocumentService } from "@/lib/document-service-working"
import { createClient } from '@supabase/supabase-js'
import { validateToken } from '@/lib/auth-utils'

// Verificar autenticación
async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'No token', status: 401 }
    }

    const token = authHeader.substring(7)
    const { valid, error } = validateToken(token)
    
    if (!valid) {
      return { user: null, error: error || 'Invalid token', status: 401 }
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return { user: null, error: 'User not found', status: 401 }
    }

    // Verificar admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (adminError || !adminUser) {
      return { user: null, error: 'Not admin', status: 403 }
    }

    return { user, error: null, status: 200 }
  } catch (error) {
    return { user: null, error: 'Auth error', status: 500 }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Nueva subida iniciada')
    
    // Verificar auth
    const { user, error, status } = await verifyAuth(request)
    if (!user) {
      console.error('❌ Auth falló:', error)
      return NextResponse.json({ error }, { status })
    }
    
    console.log('✅ Usuario autenticado:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentData = JSON.parse(formData.get('documentData') as string)

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 })
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo no permitido" }, { status: 400 })
    }

    // Validar tamaño (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "Archivo muy grande" }, { status: 400 })
    }

    // Crear documento
    console.log('📝 Creando documento:', documentData.title)
    const document = await simpleDocumentService.createDocumentWithFile(
      documentData,
      file,
      file.name,
      file.type,
      user.id
    )

    console.log('✅ Documento creado exitosamente')
    return NextResponse.json(document, { status: 201 })

  } catch (error) {
    console.error("❌ Error en upload:", error)
    return NextResponse.json({ 
      error: "Error subiendo documento",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
