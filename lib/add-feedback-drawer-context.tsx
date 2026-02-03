'use client'

import { createContext, useContext, useState, useCallback } from 'react'

type AddFeedbackDrawerContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openDrawer: () => void
  closeDrawer: () => void
}

const AddFeedbackDrawerContext = createContext<AddFeedbackDrawerContextValue | null>(null)

export function AddFeedbackDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  return (
    <AddFeedbackDrawerContext.Provider value={{ open, setOpen, openDrawer, closeDrawer }}>
      {children}
    </AddFeedbackDrawerContext.Provider>
  )
}

export function useAddFeedbackDrawer() {
  const ctx = useContext(AddFeedbackDrawerContext)
  if (!ctx) throw new Error('useAddFeedbackDrawer must be used within AddFeedbackDrawerProvider')
  return ctx
}
