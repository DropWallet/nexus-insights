import { cn } from '@/lib/utils'

export type TagChipTag = {
  id?: string
  name: string
  color_code?: string | null
}

interface TagChipProps {
  tag: TagChipTag
  className?: string
  /** When provided, clicking the chip toggles this tag in the board filter. */
  onClick?: () => void
}

const chipClasses =
  'px-2 py-0.5 rounded text-neutral-subdued bg-surface-translucent-mid hover:bg-surface-translucent-high hover:text-neutral-strong'

const bodySmStyle = {
  fontSize: 'var(--text-body-sm)',
  lineHeight: 'var(--text-body-sm--line-height)',
} as const

/** Display-only tag pill (e.g. on cards). Uses theme variables only. Optional onClick for filter. */
export function TagChip({ tag, className, onClick }: TagChipProps) {
  const content = <span style={bodySmStyle}>{tag.name}</span>
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        className={cn(chipClasses, 'cursor-pointer text-left', className)}
        style={bodySmStyle}
      >
        {tag.name}
      </button>
    )
  }
  return (
    <span className={cn(chipClasses, className)} style={bodySmStyle}>
      {tag.name}
    </span>
  )
}

interface TagChipWithRemoveProps extends Omit<TagChipProps, 'onClick'> {
  onRemove: () => void
  /** When provided, clicking the tag name (not ×) applies this tag as a board filter. */
  onTagClick?: (tag: TagChipTag) => void
}

/** Tag pill with × button to remove (e.g. in insight sheet). Uses theme variables only. Optional onTagClick for filter. */
export function TagChipWithRemove({ tag, onRemove, onTagClick, className }: TagChipWithRemoveProps) {
  const nameNode =
    onTagClick && tag.id ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onTagClick(tag)
        }}
        className="cursor-pointer text-left min-w-0"
        style={bodySmStyle}
      >
        {tag.name}
      </button>
    ) : (
      <span style={bodySmStyle}>{tag.name}</span>
    )
  return (
    <span className={cn('inline-flex items-center gap-1', chipClasses, className)} style={bodySmStyle}>
      {nameNode}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="ml-0.5 text-neutral-subdued hover:text-danger-moderate"
        aria-label={`Remove ${tag.name}`}
      >
        ×
      </button>
    </span>
  )
}
