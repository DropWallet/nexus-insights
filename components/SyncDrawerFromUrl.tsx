'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useAddFeedbackDrawer } from '@/lib/add-feedback-drawer-context'

export function SyncDrawerFromUrl() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setOpen } = useAddFeedbackDrawer()

  useEffect(() => {
    if (pathname === '/ingest') {
      setOpen(true)
      router.replace('/?openAnalyse=1')
      return
    }
    if (searchParams.get('openAnalyse') === '1') {
      setOpen(true)
      router.replace(pathname || '/')
    }
  }, [pathname, searchParams, router, setOpen])

  return null
}
