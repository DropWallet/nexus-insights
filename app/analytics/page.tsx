import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Typography } from '@/components/Typography'
import { TagFrequencyChart, type TagCountRow } from '@/components/TagFrequencyChart'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-neutral-moderate">
            Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to load analytics.
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  const supabase = createServerSupabaseClient()

  const [themesRes, tagsRes, linksRes, countRes] = await Promise.all([
    supabase.from('themes').select('id, name').order('order_index'),
    supabase.from('tags').select('id, name, color_code').order('name'),
    supabase.from('insight_tags').select('tag_id, insights(theme_id)'),
    supabase.from('insight_tags').select('tag_id'),
  ])

  if (themesRes.error || tagsRes.error || linksRes.error || countRes.error) {
    const msg =
      themesRes.error?.message ??
      tagsRes.error?.message ??
      linksRes.error?.message ??
      countRes.error?.message
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-danger-moderate">
            Failed to load analytics: {msg}
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  const themes = (themesRes.data ?? []) as { id: string; name: string }[]
  const tags = (tagsRes.data ?? []) as { id: string; name: string; color_code: string | null }[]
  const linksRaw = linksRes.data ?? []
  type LinkRow = { tag_id: string; insights: { theme_id: string } | { theme_id: string }[] | null }
  const links = linksRaw as LinkRow[]

  // Build countAll from a flat list (one row per insight_tag) so counts are correct
  const countAll: Record<string, number> = {}
  const countRows = (countRes.data ?? []) as { tag_id: string }[]
  for (const row of countRows) {
    if (row.tag_id) {
      countAll[row.tag_id] = (countAll[row.tag_id] ?? 0) + 1
    }
  }

  // Build countByTheme from nested links (insights.theme_id)
  const countByTheme: Record<string, Record<string, number>> = {}
  for (const row of links) {
    const insight = Array.isArray(row.insights) ? row.insights[0] : row.insights
    const themeId = insight?.theme_id ?? null
    if (themeId && row.tag_id) {
      if (!countByTheme[themeId]) countByTheme[themeId] = {}
      countByTheme[themeId][row.tag_id] = (countByTheme[themeId][row.tag_id] ?? 0) + 1
    }
  }

  const tagCounts: TagCountRow[] = tags.map((t) => ({
    tagId: t.id,
    tagName: t.name,
    colorCode: t.color_code ?? null,
    countAll: countAll[t.id] ?? 0,
    countByTheme: themes.reduce<Record<string, number>>((acc, th) => {
      acc[th.id] = countByTheme[th.id]?.[t.id] ?? 0
      return acc
    }, {}),
  }))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface-base text-neutral-strong p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Typography variant="heading-lg" as="h1">
          Tag frequency
        </Typography>
        <Typography variant="body-md" className="text-neutral-moderate">
          How often each tag appears on insights. Filter by theme to see counts per column.
        </Typography>
        <TagFrequencyChart tagCounts={tagCounts} themes={themes} />
      </div>
    </div>
  )
}
