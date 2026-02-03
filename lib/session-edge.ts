/**
 * Session verification for Edge (middleware). Uses Web Crypto only.
 * Must stay in sync with lib/session.ts signing format.
 */

const COOKIE_NAME = 'session'

function base64urlToBytes(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function bytesToBase64url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function getSessionCookieName(): string {
  return COOKIE_NAME
}

export async function verifySessionTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = process.env.SESSION_SECRET
    if (!secret || secret.length < 32) return false

    const [dataB64, sig] = token.split('.')
    if (!dataB64 || !sig) return false

    const dataBytes = base64urlToBytes(dataB64)
    const data = new TextDecoder().decode(dataBytes)
    const payload = JSON.parse(data) as { ok?: boolean; exp?: number }
    if (!payload.ok || typeof payload.exp !== 'number') return false
    if (payload.exp < Math.floor(Date.now() / 1000)) return false

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data)
    )
    const expectedSig = bytesToBase64url(signature)
    if (expectedSig.length !== sig.length) return false
    const a = new TextEncoder().encode(expectedSig)
    const b = new TextEncoder().encode(sig)
    if (a.length !== b.length) return false
    let same = true
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) same = false
    return same
  } catch {
    return false
  }
}
