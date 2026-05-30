// src/components/ui/Badge.tsx
interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default'
  children: React.ReactNode
  size?:    'sm' | 'md'
}

const VARIANTS: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger:  'bg-red-50 text-red-600 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  default: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function Badge({ variant = 'default', size = 'sm', children }: BadgeProps) {
  const sz = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sz} ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    completed: 'success', paid: 'success',
    pending:   'warning', processing: 'info',
    cancelled: 'danger',  overdue: 'danger', failed: 'danger',
    low_stock: 'warning', out_of_stock: 'danger',
    stable:    'success',
  }
  return <Badge variant={map[status] ?? 'default'}>{status}</Badge>
}
