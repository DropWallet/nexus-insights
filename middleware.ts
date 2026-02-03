import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getSessionCookieName,
  verifySessionTokenEdge,
} from '@/lib/session-edge'

const AUTH_PATH = '/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow auth page and API routes and static assets
  if (pathname === AUTH_PATH) {
    const token = request.cookies.get(getSessionCookieName())?.value
    if (token && (await verifySessionTokenEdge(token))) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const token = request.cookies.get(getSessionCookieName())?.value
  if (!token || !(await verifySessionTokenEdge(token))) {
    const url = new URL(AUTH_PATH, request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|nexus-logo\\.svg).*)',
  ],
}
