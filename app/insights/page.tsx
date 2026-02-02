import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Typography } from '@/components/Typography'
import { TagChip } from '@/components/TagChip'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-neutral-moderate">
            Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to load insights.
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }
  const supabase = createServerSupabaseClient()
  const { data: insights, error: insightsError } = await supabase
    .from('insights')
    .select(`
      id,
      content,
      source_url,
      source_type,
      created_at,
      themes!insights_theme_id_fkey( name ),
      insight_tags ( tags ( name, color_code ) )
    `)
    .order('created_at', { ascending: false })

  if (insightsError) {
    return (
      <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-danger-moderate">
            Failed to load insights: {insightsError.message}
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  const list = insights ?? []

  return (
    <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            ← Home
          </Link>
          <Link href="/board" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            Board
          </Link>
          <Link href="/analytics" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            Analytics
          </Link>
          <Link href="/ingest" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            Add feedback
          </Link>
        </div>
        <Typography variant="heading-lg" as="h1">
          Insights
        </Typography>
        <Typography variant="body-md" className="text-neutral-moderate">
          All insights (newest first). Use the Board for drag-and-drop by theme.
        </Typography>

        {list.length === 0 ? (
          <div className="p-6 rounded-lg bg-surface-low border border-stroke-neutral-translucent-weak text-neutral-subdued text-body-md">
            No insights yet. <Link href="/ingest" className="text-primary-moderate underline">Add feedback</Link> to extract insights.
          </div>
        ) : (
          <ul className="space-y-4">
            {list.map((insight: Record<string, unknown>) => {
              const theme = (insight.themes as { name?: string } | null) ?? {}
              const themeName = theme.name ?? '—'
              const tagRows = (insight.insight_tags as Array<{ tags: { name: string; color_code?: string } | null }>) ?? []
              const tags = tagRows.map((r) => r.tags).filter(Boolean) as Array<{ name: string; color_code?: string }>
              const sourceType = (insight.source_type as string) || null
              const sourceUrl = (insight.source_url as string) || null
              return (
                <li
                  key={insight.id as string}
                  className="p-4 rounded-lg bg-surface-low border border-stroke-neutral-translucent-weak"
                >
                  <Typography variant="body-md" className="mb-2">
                    {insight.content as string}
                  </Typography>
                  <div className="flex flex-wrap items-center gap-2 text-body-sm">
                    <span className="text-neutral-subdued">Theme: {themeName}</span>
                    {tags.map((tag) => (
                      <TagChip key={tag.name} tag={tag} />
                    ))}
                    {sourceType && (
                      <span className="text-neutral-weak uppercase">{sourceType}</span>
                    )}
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-subdued hover:underline truncate max-w-[200px]"
                      >
                        Source
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
