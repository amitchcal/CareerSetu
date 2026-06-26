'use client'

import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from '@/components/ui/toast'
import { useToastStore } from '@/hooks/useToast'

export function Toaster() {
  const { toasts, dismiss } = useToastStore()

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast
          key={id}
          open={open}
          variant={variant}
          onOpenChange={(isOpen) => { if (!isOpen) dismiss(id) }}
        >
          <div className="flex-1 min-w-0">
            <ToastTitle>{title}</ToastTitle>
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
