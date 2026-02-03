const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'to', 'of', 'and', 'in', 'that', 'for', 'on', 'with', 'as', 'it', 'by',
  'at', 'this', 'from', 'what', 'when', 'where', 'who', 'how', 'why',
  'can', 'could', 'would', 'should', 'do', 'does', 'did', 'have', 'has',
  'me', 'my', 'we', 'our', 'you', 'your', 'they', 'them', 'their',
])

const MAX_KEYWORDS = 10

/**
 * Extract searchable keywords from a natural-language question.
 * Used for Tier 1 ILIKE filtering: removes stopwords, keeps words > 2 chars, dedupes.
 */
export function extractKeywords(question: string): string[] {
  if (!question || typeof question !== 'string') return []
  const words = question
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/^['"]|['"]$/g, '').trim())
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  return [...new Set(words)].slice(0, MAX_KEYWORDS)
}
