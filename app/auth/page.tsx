'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Typography } from '@/components/Typography'
import { Button } from '@/components/Button'
import { UniverseBackground } from '@/components/UniverseBackground'

function AuthForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/'
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Invalid access code')
        return
      }
      window.location.href = from
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-surface-base text-neutral-strong overflow-hidden">
      <UniverseBackground />
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg gap-6 px-6">
        <div className="flex flex-col items-center w-full gap-2">
          <Typography
            variant="heading-lg"
            className="w-full text-center text-neutral-strong"
          >
            Enter access code
          </Typography>
          <Typography
            variant="body-md"
            className="w-full text-center text-neutral-subdued"
          >
            Enter your code to access Nexus Insights.
          </Typography>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full gap-4"
        >
          <label htmlFor="code" className="sr-only">
            Access code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Access code"
            autoComplete="one-time-code"
            disabled={loading}
            className="w-full rounded-base border border-stroke-neutral-translucent-subdued bg-surface-base px-4 py-3 text-body-md text-neutral-strong placeholder:text-neutral-weak focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-60"
          />
          {error && (
            <Typography
              variant="body-sm"
              className="text-danger-moderate"
            >
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full"
          >
            {loading ? 'Checking…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-surface-base">
        <div className="text-neutral-subdued text-body-md">Loading…</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
