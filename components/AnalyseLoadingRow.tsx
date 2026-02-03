'use client'

import { useState, useEffect } from 'react'
import { Typography } from '@/components/Typography'

const PHRASES = [
  'Analysing',
  'Listening to Wu-tang',
  'Scrutinising',
  'Munching a Chandos',
  'Ticking the cat',
  'Punching Mike',
  'Smashing a coffee',
  'Preparing for glory',
]

export function AnalyseLoadingRow() {
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visibleLength, setVisibleLength] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'hold' | 'deleting'>('typing')
  const phrase = PHRASES[phraseIndex]

  useEffect(() => {
    if (phase === 'typing') {
      if (visibleLength < phrase.length) {
        const t = setTimeout(() => setVisibleLength((n) => n + 1), 60)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('hold'), 800)
      return () => clearTimeout(t)
    }
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('deleting'), 1200)
      return () => clearTimeout(t)
    }
    if (phase === 'deleting') {
      if (visibleLength > 0) {
        const t = setTimeout(() => setVisibleLength((n) => n - 1), 40)
        return () => clearTimeout(t)
      }
      setPhase('typing')
      setPhraseIndex((i) => (i + 1) % PHRASES.length)
      return undefined
    }
    return undefined
  }, [phase, visibleLength, phrase.length, phrase])

  return (
    <div className="flex items-center min-h-[120px]" style={{ gap: 'var(--spacing-2)' }}>
      <div className="analyse-loader" aria-hidden />
      <Typography
        variant="body-lg"
        className="text-neutral-moderate min-w-[200px] min-h-[1.5em]"
      >
        {phrase.slice(0, visibleLength)}
        <span className="animate-pulse" aria-hidden>
          |
        </span>
      </Typography>
    </div>
  )
}
