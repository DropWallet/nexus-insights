import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookieName } from '@/lib/session'

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/auth', request.url))
  res.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
