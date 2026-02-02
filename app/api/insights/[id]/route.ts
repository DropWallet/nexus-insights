import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing insight id' }, { status: 400 })
  }
  try {
    const body = await request.json() as { theme_id?: string }
    const { theme_id } = body
    if (typeof theme_id !== 'string') {
      return NextResponse.json({ error: 'theme_id required' }, { status: 400 })
    }
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('insights')
      .update({ theme_id, suggested_theme_id: null })
      .eq('id', id)
      .select('id, theme_id, suggested_theme_id')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 }
    )
  }
}
