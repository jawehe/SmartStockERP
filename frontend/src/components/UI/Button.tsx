// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'danger' | 'ghost'
  size?:     'sm' | 'md' | 'lg'
  loading?:  boolean
  icon?:     string   // emoji or symbol
  children?: ReactNode
}

const VARIANTS: Record<string, string> = {
  primary:   'bg-[#1e4db7] hover:bg-[#1a3fa0] text-white border-[#1e4db7]',
  secondary: 'bg-white hover:bg-gray-50 text-[#1a2e4a] border-[#e4e9f0]',
  danger:    'bg-red-500 hover:bg-red-600 text-white border-red-500',
  ghost:     'bg-transparent hover:bg-gray-100 text-[#6b7a99] border-transparent',
}
const SIZES: Record<string, string> = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2   text-sm gap-2',
  lg:  'px-5 py-2.5 text-sm gap-2',
}

export function Button({
  variant = 'primary', size = 'md', loading = false,
  icon, children, disabled, className = '', ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg border
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        : icon && <span>{icon}</span>
      }
      {children}
    </button>
  )
}
