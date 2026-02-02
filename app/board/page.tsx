'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Typography } from '@/components/Typography'
import { cn } from '@/lib/utils'
import type { Theme, Insight, Tag } from '@/lib/types'

const INSIGHTS_SELECT = `
  id,
  content,
  source_url,
  source_type,
  theme_id,
  suggested_theme_id,
  created_at,
  themes!insights_theme_id_fkey( name ),
  suggested_theme:themes!insights_suggested_theme_id_fkey( name ),
  insight_tags ( tag_id, tags ( id, name, color_code ) )
`

export default function BoardPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (typeof window === 'undefined') return
    const supabase = createBrowserSupabaseClient()
    const [themesRes, insightsRes, tagsRes] = await Promise.all([
      supabase.from('themes').select('id, name, order_index').order('order_index'),
      supabase.from('insights').select(INSIGHTS_SELECT).order('created_at', { ascending: false }),
      supabase.from('tags').select('id, name, color_code').order('name'),
    ])
    if (themesRes.error) {
      setError(themesRes.error.message)
      setLoading(false)
      return
    }
    if (insightsRes.error) {
      setError(insightsRes.error.message)
      setLoading(false)
      return
    }
    setThemes((themesRes.data ?? []) as Theme[])
    setInsights((insightsRes.data ?? []) as unknown as Insight[])
    setAllTags((tagsRes.data ?? []) as Tag[])
    setError(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleTagFilter = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  const filteredInsights =
    selectedTagIds.size === 0
      ? insights
      : insights.filter((i) => {
          const cardTagIds = new Set(
            (i.insight_tags ?? []).map((it) => it.tags?.id).filter(Boolean) as string[]
          )
          return [...selectedTagIds].every((tid) => cardTagIds.has(tid))
        })

  const insightsByTheme = themes.reduce<Record<string, Insight[]>>((acc, t) => {
    acc[t.id] = filteredInsights.filter((i) => i.theme_id === t.id)
    return acc
  }, {})

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) return
    const insightId = result.draggableId
    const newThemeId = result.destination.droppableId
    setInsights((prev) =>
      prev.map((i) =>
        i.id === insightId
          ? { ...i, theme_id: newThemeId, suggested_theme_id: null, suggested_theme: null }
          : i
      )
    )
    try {
      const res = await fetch(`/api/insights/${insightId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_id: newThemeId }),
      })
      if (!res.ok) {
        await fetchData()
      }
    } catch {
      await fetchData()
    }
  }

  async function removeTag(insightId: string, tagId: string) {
    const supabase = createBrowserSupabaseClient()
    await supabase.from('insight_tags').delete().eq('insight_id', insightId).eq('tag_id', tagId)
    setInsights((prev) =>
      prev.map((i) => {
        if (i.id !== insightId) return i
        return {
          ...i,
          insight_tags: (i.insight_tags ?? []).filter((it) => it.tags?.id !== tagId),
        }
      })
    )
    setOpenCardId(null)
  }

  async function addTag(insightId: string, tagId: string) {
    const supabase = createBrowserSupabaseClient()
    const tag = allTags.find((t) => t.id === tagId)
    if (!tag) return
    await supabase.from('insight_tags').upsert(
      { insight_id: insightId, tag_id: tagId },
      { onConflict: 'insight_id,tag_id' }
    )
    setInsights((prev) =>
      prev.map((i) => {
        if (i.id !== insightId) return i
        const has = (i.insight_tags ?? []).some((it) => it.tags?.id === tagId)
        if (has) return i
        return {
          ...i,
          insight_tags: [...(i.insight_tags ?? []), { tag_id: tagId, tags: tag }],
        }
      })
    )
  }

  if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    return (
      <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-neutral-moderate">
            Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base text-neutral-strong p-6 flex items-center justify-center">
        <Typography variant="body-md" className="text-neutral-subdued">
          Loading board…
        </Typography>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
        <div className="max-w-2xl mx-auto">
          <Typography variant="body-md" className="text-danger-moderate">
            {error}
          </Typography>
          <Link href="/" className="mt-4 inline-block text-body-sm text-primary-moderate">
            ← Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-base text-neutral-strong flex flex-col">
      <header className="flex-shrink-0 p-4 border-b border-stroke-neutral-translucent-weak">
        <div className="flex items-center gap-4 mb-3">
          <Link href="/" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            ← Home
          </Link>
          <Link href="/ingest" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            Add feedback
          </Link>
          <Link href="/insights" className="text-neutral-subdued hover:text-neutral-strong text-body-sm">
            List view
          </Link>
        </div>
        <Typography variant="heading-md" as="h1">
          Insight board
        </Typography>
        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagFilter(tag.id)}
                className={cn(
                  'px-2 py-1 rounded-base text-body-sm transition-colors',
                  selectedTagIds.has(tag.id)
                    ? 'ring-2 ring-primary-moderate bg-primary-moderate/20 text-primary-strong'
                    : 'bg-surface-mid text-neutral-moderate hover:bg-surface-high'
                )}
                style={
                  !selectedTagIds.has(tag.id)
                    ? { backgroundColor: `${tag.color_code ?? '#6b7280'}20`, color: tag.color_code ?? '#6b7280' }
                    : undefined
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 overflow-x-auto p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max pb-4">
            {themes.map((theme) => (
              <Droppable key={theme.id} droppableId={theme.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-shrink-0 w-72 rounded-lg border p-3 min-h-[200px] transition-colors',
                      snapshot.isDraggingOver
                        ? 'border-primary-moderate bg-surface-translucent-low'
                        : 'border-stroke-neutral-translucent-subdued bg-surface-low'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Typography variant="title-sm" className="text-neutral-moderate">
                        {theme.name}
                      </Typography>
                      <span className="text-body-sm text-neutral-weak">
                        {(insightsByTheme[theme.id] ?? []).length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(insightsByTheme[theme.id] ?? []).map((insight, index) => (
                        <Draggable key={insight.id} draggableId={insight.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'relative rounded-lg border p-3 bg-surface-mid border-stroke-neutral-translucent-weak hover:border-stroke-neutral-translucent-moderate',
                                snapshot.isDragging && 'opacity-90 shadow-lg'
                              )}
                            >
                              <div
                                className="cursor-pointer"
                                onClick={() => setOpenCardId(openCardId === insight.id ? null : insight.id)}
                                onKeyDown={(e) => e.key === 'Enter' && setOpenCardId(openCardId === insight.id ? null : insight.id)}
                                role="button"
                                tabIndex={0}
                              >
                                <Typography variant="body-sm" className="line-clamp-3 mb-2">
                                  {insight.content}
                                </Typography>
                                {insight.suggested_theme?.name && insight.suggested_theme_id && insight.suggested_theme_id !== insight.theme_id && (
                                  <span className="text-body-xs text-neutral-weak mb-2 block">
                                    Suggested: {insight.suggested_theme.name}
                                  </span>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {(insight.insight_tags ?? []).map((it) =>
                                    it.tags ? (
                                      <span
                                        key={it.tags.id}
                                        className="px-1.5 py-0.5 rounded text-body-xs"
                                        style={{
                                          backgroundColor: `${(it.tags.color_code ?? '#6b7280')}30`,
                                          color: it.tags.color_code ?? '#9ca3af',
                                        }}
                                      >
                                        {it.tags.name}
                                      </span>
                                    ) : null
                                  )}
                                </div>
                              </div>

                              {openCardId === insight.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    aria-hidden
                                    onClick={() => setOpenCardId(null)}
                                  />
                                  <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-stroke-neutral-translucent-subdued bg-surface-high p-3 shadow-lg">
                                    <Typography variant="title-xs" className="mb-2 text-neutral-moderate">
                                      Tags
                                    </Typography>
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {(insight.insight_tags ?? []).map((it) =>
                                        it.tags ? (
                                          <span
                                            key={it.tags.id}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-body-sm"
                                            style={{
                                              backgroundColor: `${(it.tags.color_code ?? '#6b7280')}30`,
                                              color: it.tags.color_code ?? '#9ca3af',
                                            }}
                                          >
                                            {it.tags.name}
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                removeTag(insight.id, it.tags!.id)
                                              }}
                                              className="ml-0.5 text-neutral-weak hover:text-danger-moderate"
                                              aria-label={`Remove ${it.tags.name}`}
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ) : null
                                      )}
                                    </div>
                                    <Typography variant="title-xs" className="mb-1 text-neutral-moderate">
                                      Add tag
                                    </Typography>
                                    <div className="flex flex-wrap gap-1">
                                      {allTags
                                        .filter(
                                          (t) =>
                                            !(insight.insight_tags ?? []).some(
                                              (it) => it.tags?.id === t.id
                                            )
                                        )
                                        .map((t) => (
                                          <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => addTag(insight.id, t.id)}
                                            className="px-2 py-0.5 rounded text-body-sm bg-surface-mid hover:bg-surface-high"
                                            style={{
                                              color: t.color_code ?? '#9ca3af',
                                            }}
                                          >
                                            + {t.name}
                                          </button>
                                        ))}
                                      {allTags.filter(
                                        (t) =>
                                          !(insight.insight_tags ?? []).some(
                                            (it) => it.tags?.id === t.id
                                          )
                                      ).length === 0 && (
                                        <span className="text-body-sm text-neutral-weak">
                                          All tags added
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  )
}
