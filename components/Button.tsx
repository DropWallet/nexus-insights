import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base',
        {
          'bg-primary-moderate text-neutral-inverted hover:bg-primary-strong': variant === 'primary',
          'bg-surface-translucent-mid border border-stroke-neutral-translucent-subdued text-neutral-strong hover:bg-surface-translucent-low': variant === 'secondary',
          'bg-transparent text-neutral-strong hover:bg-surface-translucent-low': variant === 'tertiary',
        },
        {
          'px-3 py-1 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
