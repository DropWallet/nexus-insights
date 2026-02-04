/**
 * Parse Nexus Mods profile URL to extract username.
 * e.g. https://www.nexusmods.com/profile/toebeann -> "toebeann"
 */
export function parseUsernameFromProfileUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  try {
    const u = new URL(trimmed)
    if (!/^(https?:)?\/\/(www\.)?nexusmods\.com$/i.test(u.origin)) return null
    const match = u.pathname.match(/^\/profile\/([^/?#]+)/i)
    return match ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

export type NexusUser = {
  name: string
  avatar: string
  memberId: number
}

const NEXUS_GRAPHQL = 'https://api.nexusmods.com/v2/graphql'

/**
 * Fetch Nexus Mods user by username via GraphQL userByName.
 * Returns null if not found or request fails.
 */
export async function fetchNexusUserByUsername(username: string): Promise<NexusUser | null> {
  if (!username?.trim()) return null
  const query = `
    query userByName($name: String!) {
      userByName(name: $name) {
        name
        avatar
        memberId
      }
    }
  `
  try {
    const res = await fetch(NEXUS_GRAPHQL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { name: username.trim() },
      }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data?: { userByName?: { name: string; avatar: string; memberId: number } }
      errors?: unknown[]
    }
    if (json.errors?.length || !json.data?.userByName) return null
    const u = json.data.userByName
    return {
      name: u.name ?? '',
      avatar: u.avatar ?? '',
      memberId: u.memberId ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * From a mod author profile URL, resolve display name and avatar URL.
 * Returns null if URL invalid or API fails.
 */
export async function resolveModAuthorFromUrl(profileUrl: string): Promise<{
  mod_author_url: string
  mod_author_name: string
  mod_author_avatar_url: string
} | null> {
  const username = parseUsernameFromProfileUrl(profileUrl)
  if (!username) return null
  const user = await fetchNexusUserByUsername(username)
  if (!user) return null
  const normalizedUrl =
    profileUrl.trim().startsWith('http')
      ? profileUrl.trim()
      : `https://www.nexusmods.com/profile/${encodeURIComponent(username)}`
  return {
    mod_author_url: normalizedUrl,
    mod_author_name: user.name || username,
    mod_author_avatar_url: user.avatar || `https://avatars.nexusmods.com/${user.memberId}/100`,
  }
}
