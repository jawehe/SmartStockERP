// src/pages/shared/ProductsPage.tsx
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import api from '../../services/api'
import type { Product, Category, ProductForm } from '../../types/index'
import { usePermissions } from '../../hooks/usePermissions'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Badge } from '../../components/UI/Badge'
import { Table, Pagination } from '../../components/UI/Table'
import type { Column } from '../../components/UI/Table'

const inputCls = "w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors"

function StockBar({ stock, threshold }: { stock: number; threshold: number }) {
  const max = Math.max(stock * 1.5, threshold * 3, 20)
  const pct = Math.min((stock / max) * 100, 100)
  const color = stock === 0 ? '#dc2626' : stock <= threshold ? '#d97706' : '#1e4db7'
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#e4e9f0] rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={`text-sm font-medium ${stock === 0 ? 'text-red-600' : stock <= threshold ? 'text-amber-600' : 'text-[#1a2e4a]'}`}>
        {stock}
      </span>
    </div>
  )
}

export default function ProductsPage() {
  const { canCreateProduct, canEditProduct, canDeleteProduct, canManageStock } = usePermissions()

  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [meta, setMeta]             = useState<{ total: number; total_pages: number }>({ total: 0, total_pages: 1 })
  const [search, setSearch]         = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [lowOnly, setLowOnly]       = useState(false)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [open, setOpen]             = useState(false)
  const [editing, setEditing]       = useState<Product | null>(null)
  const [form, setForm]             = useState<ProductForm>({ name:'', sku:'', price:'', stock_quantity:'', low_stock_threshold:'5', category_id:'', description:'' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')


 const [reload, setReload] = useState(0)

useEffect(() => {
  let cancelled = false

  async function fetchProducts() {
    setLoading(true)

    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '10',
      })

      if (search) params.set('search', search)
      if (catFilter) params.set('category_id', catFilter)
      if (lowOnly) params.set('low_stock', 'true')

      const res = await api.get<{
        data: Product[]
        meta: typeof meta
      }>(`/products?${params.toString()}`)

      if (!cancelled) {
        setProducts(res.data.data ?? [])
        setMeta(res.data.meta ?? {
          total: 0,
          total_pages: 1,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      if (!cancelled) setLoading(false)
    }
  }

  void fetchProducts()

  return () => {
    cancelled = true
  }
}, [search, catFilter, lowOnly, page, reload])

   
useEffect(() => {
  let cancelled = false

  async function fetchCategories() {
    try {
      const r = await api.get<{ data: Category[] }>('/categories')

      if (!cancelled) {
        setCategories(r.data.data ?? [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  void fetchCategories()

  return () => {
    cancelled = true
  }
}, [])

 
  const setF = (k: keyof ProductForm) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const openAdd = () => {
    setEditing(null)
    setForm({ name:'', sku:'', price:'', stock_quantity:'', low_stock_threshold:'5', category_id:'', description:'' })
    setError(''); setOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name:p.name, sku:p.sku, price:String(p.price), stock_quantity:String(p.stock_quantity), low_stock_threshold:String(p.low_stock_threshold), category_id:String(p.category_id??''), description:p.description??'' })
    setError(''); setOpen(true)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/products/${editing.id}`, form)
      else         await api.post('/products', form)
      setOpen(false) 
      setReload((n) => n + 1)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (p: Product) => {
    if (!window.confirm(`Supprimer "${p.name}" ?`)) return
    try { await api.delete(`/products/${p.id}`)
setReload((n) => n + 1) }
    catch (e: unknown) { alert((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur') }
  }

  const COLUMNS: Column<Product>[] = [
    {
      key: 'product', header: 'PRODUCT NAME',
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-base shrink-0">📦</div>
          <div>
            <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
            <div className="text-[11px] text-[#9aa5bf]">{p.description?.slice(0,32) ?? '—'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'sku', header: 'SKU', width: '140px',
      render: (p) => <span className="font-mono text-xs text-[#6b7a99]">{p.sku}</span>,
    },
    {
      key: 'category', header: 'CATEGORY', width: '130px',
      render: (p) => p.category_name
        ? <Badge variant="info">{p.category_name}</Badge>
        : <span className="text-[#9aa5bf]">—</span>,
    },
    {
      key: 'stock', header: 'STOCK LEVEL', width: '140px',
      render: (p) => <StockBar stock={p.stock_quantity} threshold={p.low_stock_threshold} />,
    },
    {
      key: 'price', header: 'PRICE', width: '100px',
      render: (p) => <span className="font-semibold text-sm">${Number(p.price).toFixed(2)}</span>,
    },
    {
      key: 'actions', header: 'ACTIONS', width: '100px',
      render: (p) => (
        <div className="flex gap-1.5">
          {canEditProduct && (
            <button onClick={() => openEdit(p)} className="text-[#9aa5bf] hover:text-[#1e4db7] transition-colors text-sm">✏</button>
          )}
          {canManageStock && (
            <button className="text-[#9aa5bf] hover:text-amber-500 transition-colors text-sm" title="Ajuster stock">⊞</button>
          )}
          {canDeleteProduct && (
            <button onClick={() => void del(p)} className="text-[#9aa5bf] hover:text-red-500 transition-colors text-sm">🗑</button>
          )}
          <button className="text-[#9aa5bf] hover:text-[#1a2e4a] transition-colors text-sm">⋮</button>
        </div>
      ),
    },
  ]

  const lowCount = products.filter((p) => p.is_low_stock).length
  const outCount = products.filter((p) => p.stock_quantity === 0).length
// src/pages/shared/ProductsPage.tsx
const exportToCSV = async () => {
  try {
    // Utiliser les filtres actuels
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (catFilter) params.set('category_id', catFilter)
    if (lowOnly) params.set('low_stock', 'true')
    params.set('per_page', '1000')
    
    const response = await api.get(`/products?${params.toString()}`)
    const products = response.data.data || response.data || []
    
    const headers = ['ID', 'Name', 'SKU', 'Price', 'Stock', 'Status', 'Category']
    
    const rows: (string | number)[][] = products.map((product: Product) => [
      product.id,
      product.name,
      product.sku,
      product.price,
      product.stock_quantity,
      product.stock_quantity <= product.low_stock_threshold ? '⚠️ Low Stock' : '✅ In Stock',
      product.category_name || ''
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row: (string | number)[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `products_filtered_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert(`Export CSV réussi ✅ (${products.length} produits)` )
  } catch (error) {
    console.error('Export error:', error)
    alert('Erreur lors de l\'export CSV')
  }
}
// Dans chaque page (ProductsPage, SalesPage, ClientsPage, PurchasesPage)

const exportToExcel = async () => {
  try {
    const response = await api.get('/export/products', {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `products_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    
    alert('✅ Export Excel réussi !')
  } catch (error) {
    console.error('Export error:', error)
    alert('❌ Erreur lors de l\'export Excel')
  }
}
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Product Inventory</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Manage and track enterprise assets across all warehouses.</p>
        </div>
        <div className="flex gap-2.5">
         <Button variant="secondary" icon="↓" onClick={exportToCSV}>Export CSV</Button>
         <Button variant="secondary" icon="📊" onClick={exportToExcel}>
  Export Excel
</Button>
          {canCreateProduct && <Button icon="⊕" onClick={openAdd}>Add Product</Button>}
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label:'TOTAL PRODUCTS', value: meta.total,        sub:'+12% this month', subColor:'text-green-600' },
          { label:'LOW STOCK ALERT',value: lowCount,           sub:'Requires Attention', subColor:'text-red-500' },
          { label:'INVENTORY VALUE',value: '$420k',           sub:'$ USD Total',      subColor:'text-[#6b7a99]' },
          { label:'OUT OF STOCK',   value: outCount,           sub:'Restocking soon',  subColor:'text-[#6b7a99]' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl px-5 py-4">
            <div className="text-xs font-semibold text-[#6b7a99] tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl font-bold text-[#1a2e4a] mb-1">{k.value}</div>
            <div className={`text-xs font-medium ${k.subColor}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center flex-wrap">
        <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white outline-none focus:border-[#1e4db7]">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1.5">
          {['Compact','Relaxed'].map((d) => (
            <button key={d} className="px-3 py-1.5 border border-[#e4e9f0] rounded-md text-xs hover:bg-gray-50 transition-colors">{d}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#6b7a99] cursor-pointer">
            <input type="checkbox" checked={lowOnly} onChange={(e) => { setLowOnly(e.target.checked); setPage(1) }} className="accent-[#1e4db7]" />
            Low stock only
          </label>
          <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-9 w-64 focus-within:border-[#1e4db7] transition-colors">
            <span className="text-[#9aa5bf] text-sm">🔍</span>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search inventory, SKUs..."
              className="flex-1 border-none outline-none text-sm" />
          </div>
          <span className="text-xs text-[#6b7a99]">
            Showing 1 - {Math.min(page * 10, meta.total)} of <strong>{meta.total}</strong> products
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden mb-5">
        <Table
          columns={COLUMNS}
          data={products}
          loading={loading}
          empty="Aucun produit trouvé"
          getId={(p) => p.id}
        />
        {meta.total_pages > 1 && (
          <Pagination
            page={page} totalPages={meta.total_pages}
            total={meta.total} perPage={10}
            onChange={setPage}
          />
        )}
      </div>

      {/* AI + Automation banners */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-[#1e4db7] to-[#1565c0] rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
          <h3 className="font-bold text-base mb-2">Automate Your Inventory</h3>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            Connect your ERP to real-time sales channels to automatically decrement stock levels and trigger re-order alerts.
          </p>
          <button className="bg-white text-[#1e4db7] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
            Explore Integrations
          </button>
        </div>
        <div className="bg-white border border-[#e4e9f0] rounded-xl p-6 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-[#f0f4ff] rounded-2xl flex items-center justify-center text-3xl mb-4">✨</div>
          <div className="font-bold text-sm text-[#1a2e4a] mb-2">Predictive Analytics</div>
          <p className="text-xs text-[#6b7a99] leading-relaxed mb-4">
            Our AI model suggests next month's order quantities based on seasonal trends.
          </p>
          <button className="text-[#1e4db7] text-sm font-medium hover:underline">Learn More</button>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={editing ? 'Modifier le produit' : 'Ajouter un produit'}
        open={open} onClose={() => setOpen(false)} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button loading={saving} onClick={() => void save()}>
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </>
        }
      >
        {error && <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-sm mb-4">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Nom *</label>
            <input value={form.name} onChange={setF('name')} placeholder="Laptop Dell XPS" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">SKU *</label>
            <input value={form.sku} onChange={setF('sku')} placeholder="DELL-XPS-001" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Prix *</label>
            <input type="number" value={form.price} onChange={setF('price')} placeholder="0.00" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Stock initial</label>
            <input type="number" value={form.stock_quantity} onChange={setF('stock_quantity')} placeholder="0" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Seuil alerte</label>
            <input type="number" value={form.low_stock_threshold} onChange={setF('low_stock_threshold')} placeholder="5" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Catégorie</label>
            <select value={form.category_id} onChange={setF('category_id')} className={inputCls}>
              <option value="">— Sélectionner —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
        </div>
        <div className="mt-4"><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Description</label>
          <textarea value={form.description} onChange={setF('description')} rows={3}
            placeholder="Description optionnelle..."
            className={`${inputCls} resize-none`} /></div>
      </Modal>
    </div>
  )
}
