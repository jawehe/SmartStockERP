// src/pages/ProductsPage.tsx
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import api from '../services/api'
import type { Product, Category, ProductForm } from '../types/index'

// ── Sous-composants ─────────────────────────────────────────
function StatusBadge({ stock, threshold }: { stock: number; threshold: number }) {
  if (stock === 0)        return <span className="flex items-center gap-1 text-xs font-medium text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Out of Stock</span>
  if (stock <= threshold) return <span className="flex items-center gap-1 text-xs font-medium text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />Low Stock</span>
  return <span className="flex items-center gap-1 text-xs font-medium text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />In Stock</span>
}

function StockBar({ stock, threshold }: { stock: number; threshold: number }) {
  const max = Math.max(stock * 1.5, threshold * 3, 20)
  const pct = Math.min((stock / max) * 100, 100)
  const color = stock === 0 ? '#dc2626' : stock <= threshold ? '#d97706' : '#1e4db7'
  return (
    <div className="w-20 h-1.5 bg-[#e4e9f0] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[500px] max-h-[90vh] overflow-auto shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-[#1a2e4a]">{title}</h3>
          <button onClick={onClose} className="text-xl text-[#9aa5bf] hover:text-[#1a2e4a] transition-colors">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors"

// ── Page principale ─────────────────────────────────────────
export default function ProductsPage() {
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meta, setMeta]             = useState<{ total?: number; total_pages?: number }>({})
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [lowOnly, setLowOnly]       = useState(false)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState<Product | null>(null)
  const [form, setForm]             = useState<ProductForm>({ name: '', sku: '', price: '', stock_quantity: '', low_stock_threshold: '5', category_id: '', description: '' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' })
      if (search)    params.set('search', search)
      if (catFilter) params.set('category_id', catFilter)
      if (lowOnly)   params.set('low_stock', 'true')
      const res = await api.get<{ data: Product[]; meta: typeof meta }>(`/products?${params.toString()}`)
      setProducts(res.data.data ?? [])
      setMeta(res.data.meta ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

 useEffect(() => {
  const fetchCategories = async () => {
    try {
      const r = await api.get<{ data: Category[] }>('/categories')
      setCategories(r.data.data ?? [])
    } catch (e) {
      console.error(e)
    }
  }

  void fetchCategories()
}, [])

useEffect(() => {
  const fetchProducts = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '10',
      })

      if (search) {
        params.set('search', search)
      }

      if (catFilter) {
        params.set('category_id', catFilter)
      }

      if (lowOnly) {
        params.set('low_stock', 'true')
      }

      const res = await api.get<{ data: Product[]; meta: typeof meta }>(
        `/products?${params.toString()}`
      )

      setProducts(res.data.data ?? [])
      setMeta(res.data.meta ?? {})

    } catch (e) {
      console.error(e)

    } finally {
      setLoading(false)
    }
  }

  void fetchProducts()

}, [search, catFilter, lowOnly, page])

  const setF = (k: keyof ProductForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', sku: '', price: '', stock_quantity: '', low_stock_threshold: '5', category_id: '', description: '' })
    setError('')
    setShowModal(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, sku: p.sku, price: String(p.price), stock_quantity: String(p.stock_quantity), low_stock_threshold: String(p.low_stock_threshold), category_id: String(p.category_id ?? ''), description: p.description ?? '' })
    setError('')
    setShowModal(true)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/products/${editing.id}`, form)
      else         await api.post('/products', form)
      setShowModal(false)
      void load()
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axErr = e as { response?: { data?: { message?: string } } }
        setError(axErr.response?.data?.message ?? 'Erreur')
      }
    } finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    try { await api.delete(`/products/${id}`); void load() }
    catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axErr = e as { response?: { data?: { message?: string } } }
        alert(axErr.response?.data?.message ?? 'Erreur')
      }
    }
  }

  const lowCount = products.filter((p) => p.is_low_stock).length
  const outCount = products.filter((p) => p.stock_quantity === 0).length
  const totalVal = products.reduce((s, p) => s + p.price * p.stock_quantity, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Product Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Manage your inventory, pricing, and stock levels.</p>
        </div>
        <div className="flex gap-2.5">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-[#e4e9f0] rounded-lg text-sm font-medium text-[#6b7a99] hover:bg-gray-50 transition-colors">
            ↑ Export
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">
            ⊕ Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-[#e4e9f0] rounded-lg px-3 h-9">
          <span className="text-[#9aa5bf] text-sm">≡</span>
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by name, SKU or category..."
            className="flex-1 border-none outline-none text-sm" />
        </div>
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white text-[#1a2e4a] outline-none">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#6b7a99] cursor-pointer">
          <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(1) }}
            className="accent-[#1e4db7]" />
          Low stock only
        </label>
        <button onClick={() => void load()}
          className="w-9 h-9 border border-[#e4e9f0] rounded-lg text-base hover:bg-gray-50 transition-colors">↺</button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
              {['PRODUCT', 'SKU', 'CATEGORY', 'STOCK LEVEL', 'PRICE', 'STATUS', 'ACTIONS'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#9aa5bf]">Chargement...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm text-[#9aa5bf]">Aucun produit trouvé</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-base shrink-0">📦</div>
                    <div>
                      <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
                      <div className="text-[11px] text-[#9aa5bf]">{p.description?.slice(0, 40) ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-xs text-[#6b7a99]">{p.sku}</td>
                <td className="px-4 py-3.5">
                  <span className="bg-[#f0f4ff] text-[#1e4db7] px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {p.category_name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <StockBar stock={p.stock_quantity} threshold={p.low_stock_threshold} />
                    <span className={`text-sm ${p.stock_quantity === 0 ? 'text-red-600 font-semibold' : p.is_low_stock ? 'text-amber-600 font-semibold' : 'text-[#1a2e4a]'}`}>
                      {p.stock_quantity} Units
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-sm">${Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3.5"><StatusBadge stock={p.stock_quantity} threshold={p.low_stock_threshold} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-base text-[#9aa5bf] hover:text-[#1e4db7] transition-colors">✏</button>
                    <button onClick={() => void del(p.id, p.name)} className="text-base text-[#9aa5bf] hover:text-red-500 transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {(meta.total_pages ?? 0) > 1 && (
          <div className="flex justify-between items-center px-4 py-3 border-t border-[#e4e9f0]">
            <span className="text-xs text-[#6b7a99]">
              Showing {((page - 1) * 10) + 1}–{Math.min(page * 10, meta.total ?? 0)} of <strong>{meta.total}</strong>
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">‹</button>
              {Array.from({ length: Math.min(meta.total_pages ?? 1, 5) }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-2.5 py-1 border rounded-md text-sm ${page === n ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'border-[#e4e9f0] hover:bg-gray-50'}`}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(meta.total_pages ?? 1, p + 1))} disabled={page === (meta.total_pages ?? 1)}
                className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>

      {/* KPI bottom bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '📋', label: 'TOTAL SKU',      value: meta.total ?? products.length },
          { icon: '⚠️', label: 'LOW STOCK',       value: lowCount },
          { icon: '❌', label: 'OUT OF STOCK',    value: outCount },
          { icon: '💵', label: 'TOTAL VALUE',     value: `$${(totalVal / 1000).toFixed(1)}k` },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3.5 flex items-center gap-3">
            <span className="text-2xl">{k.icon}</span>
            <div>
              <div className="text-[11px] text-[#6b7a99] font-semibold tracking-wide">{k.label}</div>
              <div className="text-xl font-bold text-[#1a2e4a]">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Modifier le produit' : 'Ajouter un produit'} onClose={() => setShowModal(false)}>
          {error && <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-sm mb-4">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom *"><input value={form.name} onChange={setF('name')} placeholder="Ex: Laptop Dell" className={inputCls} /></Field>
            <Field label="SKU *"><input value={form.sku} onChange={setF('sku')} placeholder="Ex: DELL-001" className={inputCls} /></Field>
            <Field label="Prix *"><input type="number" value={form.price} onChange={setF('price')} placeholder="0.00" className={inputCls} /></Field>
            <Field label="Stock">
              <input type="number" value={form.stock_quantity} onChange={setF('stock_quantity')} placeholder="0" className={inputCls} />
            </Field>
            <Field label="Seuil alerte">
              <input type="number" value={form.low_stock_threshold} onChange={setF('low_stock_threshold')} placeholder="5" className={inputCls} />
            </Field>
            <Field label="Catégorie">
              <select value={form.category_id} onChange={setF('category_id')} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea value={form.description} onChange={setF('description')} rows={3}
              placeholder="Description optionnelle..."
              className={`${inputCls} resize-none`} />
          </Field>
          <div className="flex gap-2.5 justify-end mt-2">
            <button onClick={() => setShowModal(false)}
              className="px-5 py-2.5 border border-[#e4e9f0] rounded-lg text-sm hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={() => void save()} disabled={saving}
              className="px-5 py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {saving ? 'Sauvegarde...' : editing ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
