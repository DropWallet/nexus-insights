'use client'

import { useAddFeedbackDrawer } from '@/lib/add-feedback-drawer-context'

export function OpenAddFeedbackButton({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { openDrawer } = useAddFeedbackDrawer()

  return (
    <button
      type="button"
      onClick={openDrawer}
      className={className}
    >
      {children}
    </button>
  )
}
