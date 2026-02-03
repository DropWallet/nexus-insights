'use client'

import { cn } from '@/lib/utils'
import type { Tag } from '@/lib/types'

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

interface FilterTagProps {
  tag: Tag
  selected: boolean
  onToggle: () => void
  onRequestDelete: () => void
}

const bodyMdStyle = {
  fontSize: 'var(--text-body-md)',
  lineHeight: 'var(--text-body-md--line-height)',
} as const

/** Top-level filter bar tag: click name to filter, × to open delete confirmation. */
export function FilterTag({ tag, selected, onToggle, onRequestDelete }: FilterTagProps) {
  return (
    <span
      style={bodyMdStyle}
      className={cn(
        'inline-flex items-center pr-1 gap-0 rounded-base transition-colors cursor-pointer',
        'focus-within:outline-none focus-within:ring-2 focus-within:ring-focus-subdued focus-within:ring-offset-2 focus-within:ring-offset-surface-base',
        selected
          ? 'ring-2 ring-primary-moderate bg-primary-moderate/20 text-primary-strong'
          : 'bg-info-tag-bg text-info-strong hover:bg-info-tag-bg-hover hover:text-info-foreground'
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="px-2 py-1 text-left min-w-0 focus:outline-none rounded-base"
      >
        {tag.name}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRequestDelete()
        }}
        className="p-0.5 rounded hover:bg-info-tag-bg-hover text-info-strong hover:text-info-foreground focus:outline-none"
        aria-label={`Delete tag ${tag.name}`}
      >
        <CloseIcon />
      </button>
    </span>
  )
}
