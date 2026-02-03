'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { useTheme } from '@/lib/theme/provider'
import { useAddFeedbackDrawer } from '@/lib/add-feedback-drawer-context'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/board', label: 'Board' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/ingest', label: 'Add feedback', openDrawer: true },
]

function SunIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  )
}

export function AppNav() {
  const { resolvedTheme, setTheme } = useTheme()
  const { openDrawer } = useAddFeedbackDrawer()

  return (
    <header className="flex flex-shrink-0 items-center gap-6 border-b border-stroke-neutral-translucent-weak bg-surface-base px-4 py-3">
      <Link href="/" className="flex items-center gap-2 text-neutral-strong" aria-label="Nexus Insights home">
        <Image
          src="/nexus-logo.svg"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 flex-shrink-0"
        />
      </Link>
      <NavigationMenu className="max-w-none flex-1 justify-start">
        <NavigationMenuList className="gap-1">
          {navItems.map(({ href, label, openDrawer: isDrawer }) =>
            isDrawer ? (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink asChild>
                  <button
                    type="button"
                    onClick={openDrawer}
                    className={navigationMenuTriggerStyle}
                  >
                    {label}
                  </button>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem key={href}>
                <NavigationMenuLink asChild>
                  <Link href={href} className={navigationMenuTriggerStyle}>
                    {label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          )}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto">
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="rounded-base p-2 text-neutral-subdued transition-colors hover:bg-surface-translucent-mid hover:text-neutral-strong focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  )
}
