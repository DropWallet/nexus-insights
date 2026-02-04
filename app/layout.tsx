import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ThemeProvider } from '@/lib/theme/provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AddFeedbackDrawerProvider } from '@/lib/add-feedback-drawer-context'
import { AppNav } from '@/components/AppNav'
import { AddFeedbackDrawer } from '@/components/AddFeedbackDrawer'
import { SyncDrawerFromUrl } from '@/components/SyncDrawerFromUrl'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nexus Insights',
  description: 'Log, synthesise and group qualitative user feedback from multiple sources.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          <TooltipProvider>
          <AddFeedbackDrawerProvider>
            <AppNav />
            <main className="pt-16">{children}</main>
            <AddFeedbackDrawer />
            <Suspense fallback={null}>
              <SyncDrawerFromUrl />
            </Suspense>
          </AddFeedbackDrawerProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
