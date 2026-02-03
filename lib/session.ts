import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'session'
const MAX_AGE_SEC = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  ok: boolean
  exp: number
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters')
  }
  return secret
}

function sign(payload: SessionPayload): string {
  const secret = getSecret()
  const data = JSON.stringify(payload)
  const signature = createHmac('sha256', secret).update(data).digest('base64url')
  const raw = `${Buffer.from(data, 'utf8').toString('base64url')}.${signature}`
  return raw
}

export function createSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC
  return sign({ ok: true, exp })
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSecret()
    const [dataB64, sig] = token.split('.')
    if (!dataB64 || !sig) return null
    const data = Buffer.from(dataB64, 'base64url').toString('utf8')
    const payload = JSON.parse(data) as SessionPayload
    if (!payload.ok || typeof payload.exp !== 'number') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    const expectedSig = createHmac('sha256', secret).update(data).digest('base64url')
    const a = Buffer.from(expectedSig, 'utf8')
    const b = Buffer.from(sig, 'utf8')
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return payload
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}

export function getSessionMaxAge(): number {
  return MAX_AGE_SEC
}
