// src/components/ui/Table.tsx
import type { ReactNode } from 'react'

export interface Column<T> {
  key:       string
  header:    string
  width?:    string
  render:    (row: T) => ReactNode
}

interface TableProps<T> {
  columns:  Column<T>[]
  data:     T[]
  loading?: boolean
  empty?:   string
  onRow?:   (row: T) => void
  selected?: number | null
  getId?:   (row: T) => number
}

export function Table<T>({
  columns, data, loading, empty = 'Aucune donnée',
  onRow, selected, getId,
}: TableProps<T>) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}
                className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#6b7a99] tracking-wide whitespace-nowrap">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-sm text-[#9aa5bf]">
                {empty}
              </td>
            </tr>
          ) : (
            data.map((row, i) => {
              const id       = getId ? getId(row) : i
              const isActive = selected !== undefined && selected === id
              return (
                <tr key={id}
                  onClick={() => onRow?.(row)}
                  className={`border-b border-[#e4e9f0] last:border-0 transition-colors
                    ${onRow ? 'cursor-pointer' : ''}
                    ${isActive ? 'bg-[#f0f4ff]' : onRow ? 'hover:bg-gray-50/60' : ''}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm">{col.render(row)}</td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// Pagination component
interface PaginationProps {
  page:       number
  totalPages: number
  total:      number
  perPage:    number
  onChange:   (page: number) => void
}

export function Pagination({ page, totalPages, total, perPage, onChange }: PaginationProps) {
  const from = (page - 1) * perPage + 1
  const to   = Math.min(page * perPage, total)
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1)

  return (
    <div className="flex justify-between items-center px-4 py-3 border-t border-[#e4e9f0]">
      <span className="text-xs text-[#6b7a99]">
        {from}–{to} / <strong>{total}</strong>
      </span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40 hover:bg-gray-50">‹</button>
        {pages.filter((n) => n <= totalPages).map((n) => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-2.5 py-1 border rounded-md text-sm transition-colors
              ${page === n ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'border-[#e4e9f0] hover:bg-gray-50'}`}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40 hover:bg-gray-50">›</button>
      </div>
    </div>
  )
}
