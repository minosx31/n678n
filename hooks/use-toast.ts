'use client'

import { toast as sonnerToast, type ExternalToast } from 'sonner'

// Define the shape of the props expected by the old hook
// tailored to map to Sonner's API
type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ExternalToast['action']
  variant?: 'default' | 'destructive' | 'success'
} & ExternalToast

function toast({ title, description, variant, ...props }: ToastProps) {
  // Map 'destructive' variant to Sonner's 'error' type
  if (variant === 'destructive') {
    return sonnerToast.error(title, {
      description,
      ...props,
    })
  }

  // Map 'success' variant to Sonner's 'success' type
  if (variant === 'success') {
    return sonnerToast.success(title, {
      description,
      ...props,
    })
  }

  // Default toast
  return sonnerToast(title, {
    description,
    ...props,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }