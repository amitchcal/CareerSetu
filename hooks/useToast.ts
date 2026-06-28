'use client'

// Simple event-emitter toast — no context needed.
// Components call toast() directly; Toaster listens via a shared store.

import { useState, useEffect } from 'react'
import type { ToastVariant } from '@/components/ui/toast'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
  open: boolean
}

// Module-level store so all hook instances share state
let _toasts: ToastItem[] = []
let _listeners: Array<(toasts: ToastItem[]) => void> = []

function notify() {
  _listeners.forEach((fn) => fn([..._toasts]))
}

export function toast({
  title,
  description,
  variant = 'default',
}: {
  title: string
  description?: string
  variant?: ToastVariant
}) {
  const id = Math.random().toString(36).slice(2)
  const item: ToastItem = { id, title, description, variant, open: true }
  _toasts = [..._toasts, item]
  notify()

  setTimeout(() => {
    _toasts = _toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    notify()
    // remove from list after animation
    setTimeout(() => {
      _toasts = _toasts.filter((t) => t.id !== id)
      notify()
    }, 400)
  }, 4000)
}

export function useToastStore() {
  const [toasts, setToasts] = useState<ToastItem[]>(_toasts)

  useEffect(() => {
    _listeners.push(setToasts)
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  function dismiss(id: string) {
    _toasts = _toasts.map((t) => (t.id === id ? { ...t, open: false } : t))
    notify()
    setTimeout(() => {
      _toasts = _toasts.filter((t) => t.id !== id)
      notify()
    }, 400)
  }

  return { toasts, dismiss }
}


// Convenience hook matching shadcn/ui API shape: const { toast } = useToast()
export function useToast() {
  return { toast }
}
