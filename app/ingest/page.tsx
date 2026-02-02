'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Typography } from '@/components/Typography'

const SOURCE_TYPES = [
  { value: '', label: 'Select source type' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'discord', label: 'Discord' },
  { value: 'interview', label: 'Interview' },
  { value: 'slack', label: 'Slack' },
  { value: 'other', label: 'Other' },
] as const

export default function IngestPage() {
  const [text, setText] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceType, setSourceType] = useState<string>('')
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
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Network error')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-surface-base text-neutral-strong p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-neutral-subdued hover:text-neutral-strong text-body-sm"
          >
            ← Home
          </Link>
          <Link
            href="/board"
            className="text-neutral-subdued hover:text-neutral-strong text-body-sm"
          >
            Board
          </Link>
          <Link
            href="/insights"
            className="text-neutral-subdued hover:text-neutral-strong text-body-sm"
          >
            List view
          </Link>
        </div>

        <Typography variant="heading-lg" as="h1">
          Add feedback
        </Typography>
        <Typography variant="body-md" className="text-neutral-moderate">
          Paste a chunk of user feedback (interview transcript, Reddit comment, etc.). Add a source URL and type if you have them. Insights will be extracted and added to Uncategorised with suggested tags.
        </Typography>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-body-sm font-medium text-neutral-moderate mb-1">
              Feedback text
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste transcription or comment here..."
              className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-primary-moderate"
              required
              disabled={status === 'loading'}
            />
          </div>
          <div>
            <label htmlFor="sourceUrl" className="block text-body-sm font-medium text-neutral-moderate mb-1">
              Source URL (optional)
            </label>
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong placeholder-neutral-weak text-body-md focus:outline-none focus:ring-2 focus:ring-primary-moderate"
              disabled={status === 'loading'}
            />
          </div>
          <div>
            <label htmlFor="sourceType" className="block text-body-sm font-medium text-neutral-moderate mb-1">
              Source type (optional)
            </label>
            <select
              id="sourceType"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-surface-low border border-stroke-neutral-translucent-subdued text-neutral-strong text-body-md focus:outline-none focus:ring-2 focus:ring-primary-moderate"
              disabled={status === 'loading'}
            >
              {SOURCE_TYPES.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={status === 'loading' || !text.trim()}
          >
            {status === 'loading' ? 'Analyzing…' : 'Analyze'}
          </Button>
        </form>

        {status === 'success' && (
          <div className="p-4 rounded-lg bg-success-moderate/20 border border-success-subdued text-success-strong text-body-sm">
            Added {count} insight{count !== 1 ? 's' : ''} to Uncategorised.{' '}
            <Link href="/board" className="underline font-medium">
              Open board
            </Link>
            {' or '}
            <Link href="/insights" className="underline font-medium">
              list view
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
  )
}
