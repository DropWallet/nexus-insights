'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'

interface RelativeTimeProps {
  date: string
  className?: string
}

/** Abbreviate unit from formatDistanceToNowStrict: "9 hours" -> "9 hrs", no "about" or "ago". */
function shortenUnit(str: string): string {
  return str
    .replace(/\bseconds?\b/i, 'secs')
    .replace(/\bminutes?\b/i, (m) => (m === 'minute' ? 'min' : 'mins'))
    .replace(/\bhours?\b/i, (m) => (m === 'hour' ? 'hr' : 'hrs'))
    .replace(/\bdays?\b/i, (m) => (m === 'day' ? 'day' : 'days'))
    .replace(/\bweeks?\b/i, (m) => (m === 'week' ? 'week' : 'weeks'))
    .replace(/\bmonths?\b/i, (m) => (m === 'month' ? 'month' : 'months'))
    .replace(/\byears?\b/i, (m) => (m === 'year' ? 'year' : 'years'))
}

/** Renders ISO date as short relative time (e.g. "9 hrs", "9 days"). No "about" or "ago". Client-only after mount. */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <span className={className} aria-hidden>&nbsp;</span>
  }

  try {
    const raw = formatDistanceToNowStrict(new Date(date))
    const text = shortenUnit(raw)
    return <span className={className}>{text}</span>
  } catch {
    return null
  }
}
