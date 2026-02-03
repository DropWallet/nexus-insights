import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  createSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
} from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = typeof body?.code === 'string' ? body.code.trim() : ''
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('access_codes')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (error) {
      console.error('validate-code db error:', error)
      return NextResponse.json(
        { error: 'Failed to validate code' },
        { status: 500 }
      )
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    const token = createSessionToken()
    const cookieName = getSessionCookieName()
    const maxAge = getSessionMaxAge()
    const res = NextResponse.json({ ok: true })
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    })
    return res
  } catch (e) {
    console.error('validate-code error:', e)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
