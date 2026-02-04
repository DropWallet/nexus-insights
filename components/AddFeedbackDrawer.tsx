'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Drawer,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Button } from '@/components/Button'
import { Typography } from '@/components/Typography'
import { useAddFeedbackDrawer } from '@/lib/add-feedback-drawer-context'
import { AnalyseLoadingRow } from '@/components/AnalyseLoadingRow'

const SOURCE_TYPES = [
  { value: '', label: 'Select source type' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'discord', label: 'Discord' },
  { value: 'interview', label: 'Interview' },
  { value: 'slack', label: 'Slack' },
  { value: 'other', label: 'Other' },
] as const

export function AddFeedbackDrawer() {
  const { open, setOpen } = useAddFeedbackDrawer()
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceType, setSourceType] = useState<string>('')
  const [modAuthorUrl, setModAuthorUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [count, setCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setStatus('loading')
    setErrorMessage('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceUrl: sourceUrl.trim() || undefined,
          sourceType: sourceType && sourceType !== '' ? sourceType : undefined,
          modAuthorUrl: modAuthorUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMessage(data.error ?? data.details ?? 'Request failed')
        setStatus('error')
        return
      }
      setCount(data.count ?? 0)
      setStatus('success')
      setText('')
      setSourceUrl('')
      setSourceType('')
      setModAuthorUrl('')
      if (typeof window !== 'undefined' && (data.count ?? 0) > 0) {
        window.dispatchEvent(new CustomEvent('insights-updated'))
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="bottom">
      <DrawerContent side="bottom" className="flex flex-col max-h-[96vh]">
        <DrawerHandle />
        <div className="w-full max-w-2xl mx-auto mb-2 flex flex-col flex-1 min-h-0">
          <DrawerHeader>
            <DrawerTitle asChild>
              <Typography variant="heading-sm" as="h2" className="mb-3 text-neutral-strong">
                Add feedback
              </Typography>
            </DrawerTitle>
            <DrawerDescription asChild>
              <Typography variant="body-md" as="p" className="mb-5 text-neutral-subdued">
                Paste a chunk of user feedback (interview transcript, Reddit comment, etc.). Add a source URL and type if you have them. Insights will be extracted and added to Uncategorised with suggested tags.
              </Typography>
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto overflow-x-visible pl-6 pr-8 pb-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                id="drawer-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste transcription or comment here..."
                className="w-full min-h-[200px] px-4 py-4 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
                required
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label htmlFor="drawer-sourceUrl" className="block text-body-sm font-medium text-neutral-moderate mb-1">
                Source URL (optional)
              </label>
              <input
                id="drawer-sourceUrl"
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <label htmlFor="drawer-sourceType" className="block text-body-sm font-medium text-neutral-moderate mb-1">
                Source type (optional)
              </label>
              <select
                id="drawer-sourceType"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong text-body-md focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
                disabled={status === 'loading'}
              >
                {SOURCE_TYPES.map((opt) => (
                  <option key={opt.value || 'none'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="drawer-modAuthorUrl" className="block text-body-sm font-medium text-neutral-moderate mb-1">
                Mod author (Nexus profile URL, optional)
              </label>
              <input
                id="drawer-modAuthorUrl"
                type="url"
                value={modAuthorUrl}
                onChange={(e) => setModAuthorUrl(e.target.value)}
                placeholder="https://www.nexusmods.com/profile/username"
                className="w-full px-4 py-2 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
                disabled={status === 'loading'}
              />
            </div>
            {status === 'loading' ? (
              <AnalyseLoadingRow />
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!text.trim()}
              >
                Analyse
              </Button>
            )}
          </form>

          {status === 'success' && (
            <div className="p-4 rounded-lg bg-success-moderate/20 border border-success-subdued text-success-strong text-body-sm">
              Added {count} insight{count !== 1 ? 's' : ''} to Uncategorised.{' '}
              <Link href="/board" className="underline font-medium" onClick={() => setOpen(false)}>
                Open board
              </Link>
            </div>
          )}
          {status === 'error' && (
            <div className="p-4 rounded-lg bg-danger-moderate/20 border border-danger-subdued text-danger-strong text-body-sm">
              {errorMessage}
            </div>
          )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
