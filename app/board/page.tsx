'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Typography } from '@/components/Typography'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/Button'
import { TagChip, TagChipWithRemove } from '@/components/TagChip'
import { FilterTag } from '@/components/FilterTag'
import { cn } from '@/lib/utils'
import type { Theme, Insight, Tag } from '@/lib/types'

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

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

const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'to', 'of', 'and', 'in', 'that', 'for', 'on', 'with', 'as', 'it', 'by', 'at', 'this', 'from'])

function suggestTagFromContent(content: string): string {
  if (!content || typeof content !== 'string') return ''
  const words = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w.toLowerCase()))
  const phrase = words.slice(0, 3).join(' ').toLowerCase().slice(0, 30)
  return phrase.replace(/[^\w\s-]/g, '').trim() || ''
}

export default function BoardPage() {
  const [themes, setThemes] = useState<Theme[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCardId, setOpenCardId] = useState<string | null>(null)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [insightToDelete, setInsightToDelete] = useState<Insight | null>(null)
  const [addNewTagOpen, setAddNewTagOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagError, setNewTagError] = useState<string | null>(null)

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

  useEffect(() => {
    const onInsightsUpdated = () => {
      fetchData()
    }
    window.addEventListener('insights-updated', onInsightsUpdated)
    return () => window.removeEventListener('insights-updated', onInsightsUpdated)
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

  const selectedInsight = openCardId ? insights.find((i) => i.id === openCardId) : null

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

  async function deleteTag(tag: Tag) {
    const supabase = createBrowserSupabaseClient()
    const { error: deleteError } = await supabase.from('tags').delete().eq('id', tag.id)
    if (deleteError) {
      console.error('Delete tag error', deleteError)
      return
    }
    setAllTags((prev) => prev.filter((t) => t.id !== tag.id))
    setInsights((prev) =>
      prev.map((i) => ({
        ...i,
        insight_tags: (i.insight_tags ?? []).filter((it) => it.tags?.id !== tag.id),
      }))
    )
    setSelectedTagIds((prev) => {
      const next = new Set(prev)
      next.delete(tag.id)
      return next
    })
    setTagToDelete(null)
  }

  async function deleteInsight(insight: Insight) {
    const supabase = createBrowserSupabaseClient()
    const { error } = await supabase.from('insights').delete().eq('id', insight.id)
    if (error) {
      console.error('Delete insight error', error)
      return
    }
    setInsights((prev) => prev.filter((i) => i.id !== insight.id))
    setOpenCardId(null)
    setInsightToDelete(null)
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

  function openAddNewTagModal() {
    const suggestion = selectedInsight ? suggestTagFromContent(selectedInsight.content) : ''
    setNewTagName(suggestion)
    setNewTagError(null)
    setAddNewTagOpen(true)
  }

  async function createNewTagAndAdd() {
    const name = newTagName.trim().toLowerCase()
    if (!name) {
      setNewTagError('Enter a tag name.')
      return
    }
    if (!selectedInsight) return
    const supabase = createBrowserSupabaseClient()
    const { data: newTag, error: tagError } = await supabase
      .from('tags')
      .insert({ name, color_code: '#6b7280' })
      .select('id, name, color_code')
      .single()
    if (tagError) {
      if (tagError.code === '23505') {
        setNewTagError('A tag with this name already exists.')
        return
      }
      setNewTagError(tagError.message)
      return
    }
    if (!newTag) return
    setAllTags((prev) => [...prev, { ...newTag, color_code: newTag.color_code ?? null }])
    await supabase.from('insight_tags').upsert(
      { insight_id: selectedInsight.id, tag_id: newTag.id },
      { onConflict: 'insight_id,tag_id' }
    )
    setInsights((prev) =>
      prev.map((i) => {
        if (i.id !== selectedInsight.id) return i
        return {
          ...i,
          insight_tags: [...(i.insight_tags ?? []), { tag_id: newTag.id, tags: { ...newTag, color_code: newTag.color_code ?? null } }],
        }
      })
    )
    setAddNewTagOpen(false)
    setNewTagName('')
    setNewTagError(null)
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
    <div className="h-screen bg-surface-base text-neutral-strong flex flex-col overflow-hidden">
      <header className="flex-shrink-0 p-4 border-b border-stroke-neutral-translucent-weak">
        <Typography variant="heading-md" as="h1">
          Insight board
        </Typography>
        {allTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <FilterTag
                key={tag.id}
                tag={tag}
                selected={selectedTagIds.has(tag.id)}
                onToggle={() => toggleTagFilter(tag.id)}
                onRequestDelete={() => setTagToDelete(tag)}
              />
            ))}
          </div>
        )}

        <Dialog open={!!tagToDelete} onOpenChange={(open) => !open && setTagToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete tag?</DialogTitle>
              <DialogDescription>
                Delete &quot;{tagToDelete?.name}&quot;? This will remove it from all insights.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                className="bg-danger-moderate text-white hover:bg-danger-strong"
                onClick={() => tagToDelete && deleteTag(tagToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Sheet open={!!openCardId} onOpenChange={(open) => !open && setOpenCardId(null)}>
          <SheetContent side="right" className="flex flex-col p-0">
            {selectedInsight && (
              <>
                <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b border-stroke-neutral-translucent-weak px-6 py-4">
                  <SheetTitle className="text-body-md">Insight</SheetTitle>
                  <SheetClose asChild>
                    <button
                      type="button"
                      className="rounded p-1 text-neutral-subdued hover:bg-surface-translucent-mid hover:text-neutral-strong"
                      aria-label="Close"
                    >
                      <CloseIcon className="size-5" />
                    </button>
                  </SheetClose>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <Typography variant="body-md" className="mb-4 whitespace-pre-wrap text-neutral-strong">
                    {selectedInsight.content}
                  </Typography>
                  {selectedInsight.suggested_theme?.name && selectedInsight.suggested_theme_id && selectedInsight.suggested_theme_id !== selectedInsight.theme_id && (
                    <span className="text-body-sm text-neutral-weak mb-4 block">
                      Suggested: {selectedInsight.suggested_theme.name}
                    </span>
                  )}
                  {selectedInsight.source_url && (
                    <a
                      href={selectedInsight.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-primary-subdued hover:text-primary-strong hover:underline mb-4 inline-block"
                    >
                      Source
                    </a>
                  )}
                  <Typography variant="title-xs" className="mb-2 text-neutral-moderate">
                    Tags
                  </Typography>
                  <div className="mb-4 flex flex-wrap gap-1">
                    {(selectedInsight.insight_tags ?? []).map((it) =>
                      it.tags ? (
                        <TagChipWithRemove
                          key={it.tags.id}
                          tag={it.tags}
                          onRemove={() => removeTag(selectedInsight.id, it.tags!.id)}
                          onTagClick={(t) => {
                            if (t.id) {
                              toggleTagFilter(t.id)
                              setOpenCardId(null)
                            }
                          }}
                        />
                      ) : null
                    )}
                  </div>
                  <Typography variant="title-xs" className="mb-2 text-neutral-moderate">
                    Add tag
                  </Typography>
                  <div className="flex flex-wrap gap-1">
                    {allTags
                      .filter(
                        (t) =>
                          !(selectedInsight.insight_tags ?? []).some(
                            (it) => it.tags?.id === t.id
                          )
                      )
                      .map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => addTag(selectedInsight.id, t.id)}
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
                        !(selectedInsight.insight_tags ?? []).some(
                          (it) => it.tags?.id === t.id
                        )
                    ).length === 0 && (
                      <span className="text-body-sm text-neutral-weak">
                        All tags added
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openAddNewTagModal}
                      className="px-2 py-0.5 rounded text-body-sm text-neutral-subdued hover:bg-surface-translucent-mid hover:text-neutral-strong"
                    >
                      + Add new tag
                    </button>
                  </div>
                </div>
                <div className="flex-shrink-0 flex justify-end border-t border-stroke-neutral-translucent-weak px-6 py-4">
                  <Button
                    variant="secondary"
                    className="bg-danger-moderate/20 text-danger-moderate hover:bg-danger-moderate hover:text-white"
                    onClick={() => setInsightToDelete(selectedInsight)}
                  >
                    Delete insight
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        <Dialog open={!!insightToDelete} onOpenChange={(open) => !open && setInsightToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete insight?</DialogTitle>
              <DialogDescription>
                This will permanently remove this insight from the board. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                variant="primary"
                className="bg-danger-moderate text-white hover:bg-danger-strong"
                onClick={() => insightToDelete && deleteInsight(insightToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={addNewTagOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAddNewTagOpen(false)
              setNewTagError(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add new tag</DialogTitle>
              <DialogDescription>
                Create a new tag and add it to this insight. The name will be stored in lowercase.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <label htmlFor="new-tag-name" className="block text-body-sm font-medium text-neutral-moderate">
                Tag name
              </label>
              <input
                id="new-tag-name"
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g. localization, android"
                className="w-full px-4 py-2 rounded-base border border-stroke-neutral-translucent-subdued bg-surface-low text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
                onKeyDown={(e) => e.key === 'Enter' && createNewTagAndAdd()}
              />
              {newTagError && (
                <p className="text-body-sm text-danger-moderate">{newTagError}</p>
              )}
            </div>
            <DialogFooter className="mt-4 gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button variant="primary" onClick={createNewTagAndAdd}>
                Create and add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <main className="flex-1 min-h-0 overflow-x-auto p-4 flex">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 min-w-max h-full min-h-0">
            {themes.map((theme) => (
              <Droppable key={theme.id} droppableId={theme.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-shrink-0 w-72 rounded-lg p-3 h-full max-h-full flex flex-col overflow-hidden transition-colors',
                      snapshot.isDraggingOver
                        ? 'bg-surface-translucent-low'
                        : 'bg-surface-low'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <Typography variant="title-sm" className="text-neutral-moderate">
                        {theme.name}
                      </Typography>
                      <span className="text-body-sm text-neutral-weak">
                        {(insightsByTheme[theme.id] ?? []).length}
                      </span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto pl-0 pr-1 space-y-2">
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
                                <Typography variant="body-sm" className="line-clamp-4 mb-2">
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
                                      <TagChip
                                        key={it.tags.id}
                                        tag={it.tags}
                                        onClick={() => toggleTagFilter(it.tags!.id)}
                                      />
                                    ) : null
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
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
