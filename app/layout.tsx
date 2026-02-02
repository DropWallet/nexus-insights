import type { Metadata } from 'next'
import { ThemeProvider } from '@/lib/theme/provider'
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
