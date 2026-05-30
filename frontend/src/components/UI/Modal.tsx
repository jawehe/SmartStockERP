// src/components/ui/Modal.tsx
import type { ReactNode } from 'react'
import { useEffect } from 'react'


interface ModalProps {
  title:      string
  open:       boolean
  onClose:    () => void
  children:   ReactNode
  footer?:    ReactNode
  size?:      'sm' | 'md' | 'lg'
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ title, open, onClose, children, footer, size = 'md' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${SIZES[size]} max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e4e9f0]">
          <h3 className="text-base font-semibold text-[#1a2e4a]">{title}</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 transition-colors text-lg leading-none">
            ×
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#e4e9f0] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
