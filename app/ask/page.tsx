'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Typography } from '@/components/Typography'
import { AnalyseLoadingRow } from '@/components/AnalyseLoadingRow'
import { cn } from '@/lib/utils'

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)
    setAnswer(null)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong')
        return
      }
      setAnswer(data.answer ?? '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col min-h-[calc(100vh-4rem)] bg-surface-base text-neutral-strong">
      {/* Scrollable area: content scrolls under fixed input */}
      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 pt-6"
        style={{ paddingBottom: 'calc(128px + 32px + 16px + 56px)' }}
      >
        <div className="mx-auto max-w-2xl">
          <Typography variant="body-md" className="text-neutral-subdued mb-6">
            Ask a question about your insights. Answers are based on filtered insights from the board.
          </Typography>
          {error && (
            <p className="text-body-sm text-danger-moderate mb-4" role="alert">
              {error}
            </p>
          )}
          {loading && (
            <div className="mb-4">
              <AnalyseLoadingRow />
            </div>
          )}
          {answer !== null && !loading && (
            <div className="text-body-md text-neutral-strong" data-answer>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-heading-md text-neutral-strong mt-6 mb-2 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-heading-sm text-neutral-strong mt-6 mb-2 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-title-md text-neutral-strong mt-4 mb-1.5 first:mt-0">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="font-semibold text-neutral-strong">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 space-y-1 text-neutral-strong">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1 text-neutral-strong">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="text-body-md">{children}</li>,
                }}
              >
                {answer}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Gradient overlay: content fades out when scrolling under input (Gemini-style) */}
      <div
        className="fixed left-0 right-0 pointer-events-none z-10"
        style={{
          bottom: 'calc(2rem + 128px)',
          height: '80px',
          background: 'linear-gradient(to bottom, transparent, var(--color-surface-base))',
        }}
        aria-hidden
      />

      {/* Input + CTA: fixed at bottom, 32px gap, height 128px; focus ring on whole block */}
      <div className="fixed bottom-8 left-0 right-0 px-4 pointer-events-none [&>*]:pointer-events-auto z-20">
        <div className="mx-auto max-w-2xl h-32">
          <form
            onSubmit={handleSubmit}
            className={cn(
              'h-full rounded-lg border border-stroke-neutral-translucent-subdued bg-surface-low',
              'flex flex-col gap-1.5 p-3',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-focus-subdued focus-within:ring-offset-2 focus-within:ring-offset-surface-base'
            )}
          >
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask the Nexus' Gods for some insights..."
              disabled={loading}
              rows={2}
              className={cn(
                'flex-1 min-h-0 w-full resize-none rounded-base bg-transparent px-3 py-1.5 text-body-md text-neutral-strong',
                'placeholder:text-neutral-subdued',
                'focus:outline-none',
                'disabled:opacity-60'
              )}
              aria-label="Ask a question"
            />
            <div className="flex justify-end flex-shrink-0">
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className={cn(
                  'inline-flex justify-center items-center rounded-base font-medium',
                  'bg-primary-moderate text-neutral-inverted hover:bg-primary-strong hover:text-neutral-inverted',
                  'px-4 py-2 text-body-sm text-neutral-inverted transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base',
                  'disabled:opacity-50 disabled:pointer-events-none'
                )}
              >
                Go
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
