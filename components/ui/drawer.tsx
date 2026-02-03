'use client'

import * as React from 'react'
import { Drawer as VaulDrawer } from 'vaul'
import { cn } from '@/lib/utils'

const Drawer = ({
  open,
  onOpenChange,
  direction = 'bottom',
  ...props
}: React.ComponentProps<typeof VaulDrawer.Root>) => (
  <VaulDrawer.Root open={open} onOpenChange={onOpenChange} direction={direction} {...props} />
)
Drawer.displayName = 'Drawer'

const DrawerTrigger = VaulDrawer.Trigger
DrawerTrigger.displayName = 'DrawerTrigger'

const DrawerPortal = VaulDrawer.Portal

const DrawerClose = VaulDrawer.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Overlay>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DrawerOverlay.displayName = 'DrawerOverlay'

type DrawerContentProps = React.ComponentPropsWithoutRef<typeof VaulDrawer.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Content>,
  DrawerContentProps
>(({ side = 'bottom', className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <VaulDrawer.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex flex-col bg-surface-base text-neutral-strong border-stroke-neutral-translucent-subdued shadow-lg',
        side === 'right' &&
          'inset-y-0 right-0 h-full w-full max-w-md border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        side === 'left' &&
          'inset-y-0 left-0 h-full w-full max-w-md border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        side === 'top' &&
          'inset-x-0 top-0 h-auto max-h-[96vh] border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        side === 'bottom' &&
          'inset-x-0 bottom-0 h-auto max-h-[96vh] rounded-t-xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        className
      )}
      {...props}
    >
      {children}
    </VaulDrawer.Content>
  </DrawerPortal>
))
DrawerContent.displayName = 'DrawerContent'

const DrawerHandle = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Handle>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Handle>
>(({ className, ...props }, ref) => (
  <VaulDrawer.Handle
    ref={ref}
    className={cn(
      'mx-auto mt-4 h-1.5 w-12 flex-shrink-0 rounded-full bg-stroke-neutral-translucent-subdued',
      className
    )}
    {...props}
  />
))
DrawerHandle.displayName = 'DrawerHandle'

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 p-6 pb-0', className)} {...props} />
)
DrawerHeader.displayName = 'DrawerHeader'

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse p-6 pt-0', className)} {...props} />
)
DrawerFooter.displayName = 'DrawerFooter'

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Title>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Title>
>(({ className, asChild, ...props }, ref) => (
  <VaulDrawer.Title
    ref={ref}
    asChild={asChild}
    className={asChild ? className : cn('text-heading-sm font-semibold leading-none', className)}
    {...props}
  />
))
DrawerTitle.displayName = 'DrawerTitle'

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof VaulDrawer.Description>,
  React.ComponentPropsWithoutRef<typeof VaulDrawer.Description>
>(({ className, asChild, ...props }, ref) => (
  <VaulDrawer.Description
    ref={ref}
    asChild={asChild}
    className={asChild ? className : cn('text-body-sm text-neutral-moderate', className)}
    {...props}
  />
))
DrawerDescription.displayName = 'DrawerDescription'

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHandle,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
