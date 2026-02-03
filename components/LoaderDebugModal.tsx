'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AnalyseLoadingRow } from '@/components/AnalyseLoadingRow'
import { Typography } from '@/components/Typography'

export function LoaderDebugModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center focus:outline-none focus:ring-2 focus:ring-focus-subdued focus:ring-offset-2 focus:ring-offset-surface-base rounded-base"
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-heading-sm">
              Loader debug
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Typography variant="body-sm" className="text-neutral-moderate mb-4">
              Analyse loader (no form submit):
            </Typography>
            <AnalyseLoadingRow />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
