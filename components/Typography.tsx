import { cn } from '@/lib/utils'

interface TypographyProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  variant?:
    | 'heading-2xl' | 'heading-xl' | 'heading-lg' | 'heading-md' | 'heading-sm' | 'heading-xs'
    | 'title-md' | 'title-sm' | 'title-xs'
    | 'body-xxl' | 'body-xxl-semibold'
    | 'body-xl' | 'body-xl-semibold'
    | 'body-lg' | 'body-lg-semibold'
    | 'body-md' | 'body-md-semibold'
    | 'body-sm' | 'body-sm-semibold'
  className?: string
  children: React.ReactNode
}

export function Typography({
  as,
  variant = 'body-md',
  className,
  children,
}: TypographyProps) {
  const Component = as ?? getDefaultTag(variant)

  const fontSizeVar = `--text-${variant}`
  const lineHeightVar = `--text-${variant}--line-height`
  const letterSpacingVar = `--text-${variant}--letter-spacing`

  const style: React.CSSProperties = {
    fontSize: `var(${fontSizeVar})`,
    lineHeight: `var(${lineHeightVar})`,
    ...(variant.startsWith('heading-2xl') || variant.startsWith('heading-xl') || variant.startsWith('heading-lg') ||
      variant.startsWith('title-') || variant === 'body-sm' || variant === 'body-sm-semibold'
      ? { letterSpacing: `var(${letterSpacingVar})` }
      : {}),
  }

  const classes = cn(
    variant.startsWith('heading') && 'font-semibold',
    variant.startsWith('title') && 'font-semibold uppercase',
    variant.includes('semibold') && 'font-semibold',
    !variant.includes('semibold') && variant.startsWith('body') && 'font-normal',
    className
  )

  return (
    <Component className={classes} style={style}>
      {children}
    </Component>
  )
}

function getDefaultTag(variant: string): keyof JSX.IntrinsicElements {
  if (variant.startsWith('heading')) return 'h2'
  if (variant.startsWith('title')) return 'p'
  return 'p'
}
