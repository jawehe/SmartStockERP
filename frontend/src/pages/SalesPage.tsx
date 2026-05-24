// src/pages/SalesPage.tsx
import { useEffect, useState, useCallback} from 'react'
import api from '../services/api'
import type { Sale, Client, Product, SaleCartItem, SaleStatus } from '../types/index'

function StatusBadge({ status }: { status: SaleStatus }) {
  const map: Record<SaleStatus, { bg: string; color: string }> = {
    completed: { bg: '#dcfce7', color: '#16a34a' },
    pending:   { bg: '#fef3c7', color: '#d97706' },
    cancelled: { bg: '#fee2e2', color: '#dc2626' },
  }
  const s = map[status]
  return (
    <span className="px-3 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}>{status}</span>
  )
}

// Custom hook for sales data management
function useSalesData() {
  const [sales, setSales] = useState<Sale[]>([])
  const [meta, setMeta] = useState<{ total?: number; total_pages?: number; has_next?: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '10',
      })

      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (statusFilter) params.set('status', statusFilter)

      const res = await api.get<{ data: Sale[]; meta: typeof meta }>(
        `/sales?${params.toString()}`
      )

      setSales(res.data.data ?? [])
      setMeta(res.data.meta ?? {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, statusFilter])



  return {
    sales,
    meta,
    loading,
    page,
    setPage,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    statusFilter,
    setStatusFilter,
    reload: load
  }
}

// ── Create Sale view ────────────────────────────────────────
function CreateSale({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [clients, setClients]   = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [note, setNote]         = useState('')
  const [items, setItems]       = useState<SaleCartItem[]>([])
  const [search, setSearch]     = useState('')
  const [results, setResults]   = useState<Product[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [payMethod, setPayMethod] = useState('Cash')

  const [transactionId] = useState(
    () => `TXN-${Date.now().toString().slice(-8)}`
  )

  useEffect(() => {
    void api.get<{ data: Client[] }>('/clients?per_page=100').then((r) => setClients(r.data.data ?? []))
  }, [])

  const searchProduct = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setResults([]); return }
    try {
      const r = await api.get<{ data: Product[] }>(`/products?search=${q}&per_page=6`)
      setResults(r.data.data ?? [])
    } catch { setResults([]) }
  }

  const addItem = (p: Product) => {
    setResults([]); setSearch('')
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === p.id)
      if (ex) return prev.map((i) => i.product_id === p.id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { product_id: p.id, name: p.name, sku: p.sku, unit_price: p.price, quantity: 1 }]
    })
  }

  const updateQty = (id: number, q: number) => {
    if (q < 1) return
    setItems((prev) => prev.map((i) => i.product_id === id ? { ...i, quantity: q } : i))
  }

  const removeItem = (id: number) => setItems((prev) => prev.filter((i) => i.product_id !== id))

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const tax      = subtotal * 0.10
  const total    = subtotal + tax
  const fmt      = (n: number) => `$${n.toFixed(2)}`

  const submit = async () => {
    if (items.length === 0) { setError('Ajoutez au moins un produit.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/sales', {
        client_id: clientId || null,
        note: note || null,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      })
      onSuccess()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axErr = e as { response?: { data?: { message?: string } } }
        setError(axErr.response?.data?.message ?? 'Erreur création vente')
      }
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={onBack} className="text-[#6b7a99] text-sm mb-1 hover:text-[#1a2e4a] transition-colors">← Back to Sales</button>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Create New Sale</h1>
          <p className="text-sm text-[#6b7a99]"> Transaction ID: {transactionId}</p>
        </div>
        <div className="flex gap-2.5">
          <button onClick={onBack} className="px-5 py-2.5 border border-[#e4e9f0] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Draft Save</button>
          <button className="px-5 py-2.5 bg-[#1e4db7] text-white rounded-lg text-sm font-medium hover:bg-[#1a3fa0] transition-colors flex items-center gap-1.5">
            🖨 Print Quote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
        {/* Left */}
        <div className="flex flex-col gap-4">

          {/* Client */}
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-sm text-[#1a2e4a]">
              <span>👤</span> Client & Logistics
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Select Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm bg-white outline-none focus:border-[#1e4db7] transition-colors">
                  <option value="">Search or Select Client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Sales Representative</label>
                <input disabled value="Administrator"
                  className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm bg-[#f4f6f9] text-[#9aa5bf]" />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-sm text-[#1a2e4a]">
              <span>🛒</span> Product Selection
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-10">
                <span className="text-[#9aa5bf] text-sm">⊞</span>
                <input value={search} onChange={(e) => void searchProduct(e.target.value)}
                  placeholder="Search by SKU or scan barcode..."
                  className="flex-1 border-none outline-none text-sm" />
              </div>
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-[#e4e9f0] rounded-lg shadow-lg z-20 mt-1">
                  {results.map((p) => (
                    <button key={p.id} onClick={() => addItem(p)}
                      className="w-full flex justify-between items-center px-4 py-2.5 text-left border-b border-[#e4e9f0] last:border-0 hover:bg-[#f4f6f9] transition-colors">
                      <div>
                        <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
                        <div className="text-[11px] text-[#9aa5bf]">SKU: {p.sku} · Stock: {p.stock_quantity}</div>
                      </div>
                      <div className="font-semibold text-sm text-[#1e4db7]">${p.price}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            {items.length > 0 ? (
              <table className="w-full border-collapse mb-3">
                <thead>
                  <tr className="border-b border-[#e4e9f0]">
                    {['PRODUCT DESCRIPTION', 'QTY', 'UNIT PRICE', 'SUBTOTAL', ''].map((h) => (
                      <th key={h} className="text-left py-2 px-2.5 text-[11px] font-semibold text-[#6b7a99]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id} className="border-b border-[#e4e9f0] last:border-0">
                      <td className="py-3 px-2.5">
                        <div className="font-medium text-sm text-[#1a2e4a]">{item.name}</div>
                        <div className="text-[11px] text-[#9aa5bf]">SKU: {item.sku}</div>
                      </td>
                      <td className="py-3 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item.product_id, item.quantity - 1)}
                            className="w-6 h-6 border border-[#e4e9f0] rounded font-bold text-sm hover:bg-gray-50">−</button>
                          <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, item.quantity + 1)}
                            className="w-6 h-6 border border-[#e4e9f0] rounded font-bold text-sm hover:bg-gray-50">+</button>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 text-sm">{fmt(item.unit_price)}</td>
                      <td className="py-3 px-2.5 text-sm font-semibold">{fmt(item.unit_price * item.quantity)}</td>
                      <td className="py-3 px-2.5">
                        <button onClick={() => removeItem(item.product_id)} className="text-red-400 hover:text-red-600 transition-colors">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-sm text-[#9aa5bf]">Recherchez un produit pour l'ajouter</div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <label className="text-sm font-medium text-[#1a2e4a] block mb-2">Note (optionnel)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Note sur la vente..."
              className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none resize-none focus:border-[#1e4db7] transition-colors" />
          </div>
        </div>

        {/* Right — Invoice Summary */}
        <div className="sticky top-0 flex flex-col gap-3">
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="font-semibold text-sm text-[#1a2e4a] mb-1">Invoice Summary</div>
            <div className="text-xs text-[#6b7a99] mb-5">Review totals before generation</div>

            {[
              { label: 'Subtotal',      value: fmt(subtotal) },
              { label: 'Discount (0%)', value: '-$0.00' },
              { label: 'Tax (VAT 10%)', value: fmt(tax) },
            ].map((r) => (
              <div key={r.label} className="flex justify-between text-sm mb-2.5">
                <span className="text-[#6b7a99]">{r.label}</span>
                <span className="text-[#1a2e4a]">{r.value}</span>
              </div>
            ))}

            <div className="border-t border-[#e4e9f0] pt-3 mt-1">
              <div className="text-[11px] font-semibold text-[#6b7a99] mb-1">GRAND TOTAL</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#1e4db7]">{fmt(total)}</span>
                <span className="bg-[#fef3c7] text-[#d97706] px-2 py-0.5 rounded-full text-[11px] font-medium">PENDING</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="mt-4">
              <div className="text-xs font-medium text-[#6b7a99] mb-2">Payment Method</div>
              <div className="flex gap-2">
                {['Cash', 'Card', 'Transfer'].map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors
                      ${payMethod === m ? 'bg-[#e8f0fe] text-[#1e4db7] border-[#1e4db7]' : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs mt-4">{error}</div>}

            <button onClick={() => void submit()} disabled={saving || items.length === 0}
              className={`w-full mt-4 py-3 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2
                ${items.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1e4db7] hover:bg-[#1a3fa0] cursor-pointer'}`}>
              🧾 {saving ? 'Création...' : 'Generate Invoice'}
            </button>
            <p className="text-[11px] text-[#9aa5bf] text-center mt-2 leading-relaxed">
              By generating this invoice, stock levels will be automatically adjusted.
            </p>
          </div>

          {items.length > 0 && (
            <div className="bg-[#e8f0fe] border border-[#bfcfef] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#1e4db7]">ℹ</span>
                <span className="font-semibold text-sm text-[#1e4db7]">Stock Availability</span>
              </div>
              <p className="text-xs text-[#6b7a99] leading-relaxed">All items are currently in stock. Estimated delivery: 2 business days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sales List view ─────────────────────────────────────────
export default function SalesPage() {
  const [view, setView] = useState<'list' | 'create'>('list')
  const {
    sales,
    meta,
    loading,
    page,
    setPage,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    statusFilter,
    setStatusFilter,
    reload
  } = useSalesData()

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  if (view === 'create') {
    return <CreateSale onBack={() => setView('list')} onSuccess={() => { setView('list'); reload() }} />
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Sales Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Gérez vos ventes et générez des factures.</p>
        </div>
        <button onClick={() => setView('create')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">
          + Create New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center flex-wrap">
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); reload()}}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7]" />
        <span className="text-[#9aa5bf]">→</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7]" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setPage(1); reload() }}
          className="px-4 py-2 border border-[#e4e9f0] rounded-lg text-sm hover:bg-gray-50 transition-colors text-[#6b7a99]">
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
              {['ORDER ID', 'CLIENT', 'DATE', 'AMOUNT', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-[#9aa5bf]">Chargement...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-sm text-[#9aa5bf]">Aucune vente trouvée</td></tr>
            ) : sales.map((s) => (
              <tr key={s.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-[#1e4db7] font-medium text-sm font-mono">
                  #ORD-{String(s.id).padStart(5, '0')}
                </td>
                <td className="px-4 py-3 text-sm">{s.client?.name ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-[#6b7a99]">
                  {new Date(s.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">{fmt(s.total_amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                <td className="px-4 py-3">
                  {s.status !== 'cancelled' && (
                    <button onClick={async () => {
                      if (!window.confirm('Annuler cette vente ?')) return
                      try { await api.patch(`/sales/${s.id}/status`, { status: 'cancelled' }); reload() }
                      catch (e: unknown) {
                        if (e && typeof e === 'object' && 'response' in e) {
                          const axErr = e as { response?: { data?: { message?: string } } }
                          alert(axErr.response?.data?.message ?? 'Erreur')
                        }
                      }
                    }}
                      className="border border-red-400 text-red-500 rounded-md px-2.5 py-1 text-xs hover:bg-red-50 transition-colors">
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(meta.total ?? 0) > 0 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#e4e9f0]">
            <span className="text-xs text-[#6b7a99]">
              {((page - 1) * 10) + 1}–{Math.min(page * 10, meta.total ?? 0)} / <strong>{meta.total}</strong> ventes
            </span>
            <div className="flex gap-1">
              <button onClick={() => { setPage((p) => Math.max(1, p - 1)); reload() }} disabled={page === 1}
  className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">‹</button>

{[1, 2, 3].filter((n) => n <= (meta.total_pages ?? 1)).map((n) => (
  <button key={n} onClick={() => { setPage(n); reload() }}
    className={`px-2.5 py-1 border rounded-md text-sm ${page === n ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'border-[#e4e9f0] hover:bg-gray-50'}`}>{n}</button>
))}

<button onClick={() => { setPage((p) => Math.min(meta.total_pages ?? 1, p + 1)); reload() }} disabled={!meta.has_next}
  className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}