import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available')
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    console.log('🔍 Test search called with:', search)

    // First get all documents
    const { data: allDocs, error: allError } = await supabaseAdmin
      .from('documents')
      .select('id, title, author, description')
      .eq('status', 'active')

    if (allError) {
      console.error('Error getting all docs:', allError)
      throw allError
    }

    console.log('📋 All documents:', allDocs?.length, allDocs?.map(d => d.title))

    // Then get filtered documents if search is provided
    if (search) {
      const { data: filteredDocs, error: filterError } = await supabaseAdmin
        .from('documents')
        .select('id, title, author, description')
        .eq('status', 'active')
        .or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`)

      if (filterError) {
        console.error('Error getting filtered docs:', filterError)
        throw filterError
      }

      console.log('🔍 Filtered documents:', filteredDocs?.length, filteredDocs?.map(d => d.title))

      return NextResponse.json({
        search,
        total: allDocs?.length || 0,
        filtered: filteredDocs?.length || 0,
        allDocuments: allDocs,
        filteredDocuments: filteredDocs
      })
    }

    return NextResponse.json({
      total: allDocs?.length || 0,
      allDocuments: allDocs
    })

  } catch (error) {
    console.error('❌ Error in test search:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
