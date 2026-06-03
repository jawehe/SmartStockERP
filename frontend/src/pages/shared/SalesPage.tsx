// src/pages/shared/SalesPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import type { Sale, Client, Product, SaleCartItem, SaleStatus,  SaleItem } from '../../types/index'
import { usePermissions } from '../../hooks/usePermissions'
import { Button } from '../../components/UI/Button'
import { Pagination } from '../../components/UI/Table'

// ── Status badge ─────────────────────────────────────────────
function SaleBadge({ status }: { status: SaleStatus }) {
  const map: Record<SaleStatus, string> = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    cancelled: 'bg-red-50  text-red-600   border-red-200',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status==='completed'?'bg-green-500':status==='pending'?'bg-amber-500':'bg-red-500'}`} />
      {status}
    </span>
  )
}

// ── Edit Sale Modal ──────────────────────────────────────────
function EditSaleModal({ sale, onClose, onSave }: { 
  sale: Sale; 
  onClose: () => void; 
  onSave: (items: SaleCartItem[]) => void 
}) {
const [items, setItems] = useState<SaleCartItem[]>(() => {
  if (!sale.items) return []
  return sale.items.map((item: SaleItem) => ({
    product_id: item.product_id,
    name: item.product_name || 'Produit',  // ← Valeur par défaut si null
    sku: '',
    unit_price: item.unit_price,
    quantity: item.quantity
  }))
})
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Product[]>([])

  const searchProduct = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { setResults([]); return }
    try {
      const r = await api.get<{ data: Product[] }>(`/products?search=${q}&per_page=5`)
      setResults(r.data.data || [])
    } catch { setResults([]) }
  }

  const addItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.product_id === product.id)
      if (existing) {
        return prev.map(i => i.product_id === product.id 
          ? { ...i, quantity: i.quantity + 1 } 
          : i)
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        unit_price: product.price,
        quantity: 1
      }]
    })
    setSearch('')
    setResults([])
  }

  const updateQty = (productId: number, newQty: number) => {
    if (newQty < 1) return
    setItems(prev => prev.map(i => 
      i.product_id === productId ? { ...i, quantity: newQty } : i
    ))
  }

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const tax = subtotal * 0.10
  const total = subtotal + tax
  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto m-4">
        <div className="sticky top-0 bg-white border-b border-[#e4e9f0] px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#1a2e4a]">Modifier la vente</h2>
            <p className="text-sm text-[#6b7a99]">#INV-{String(sale.id).padStart(4, '0')}</p>
          </div>
          <button onClick={onClose} className="text-[#9aa5bf] hover:text-[#1a2e4a]">✕</button>
        </div>

        <div className="p-6">
          {/* Recherche produits */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => searchProduct(e.target.value)}
                placeholder="Ajouter un produit (SKU ou nom)..."
                className="w-full px-4 py-2 border border-[#e4e9f0] rounded-lg focus:outline-none focus:border-[#1e4db7]"
              />
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1">
                  {results.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addItem(p)}
                      className="w-full flex justify-between items-center px-4 py-2 hover:bg-gray-50 border-b last:border-0"
                    >
                      <span>{p.name}</span>
                      <span className="text-[#1e4db7] font-semibold">${p.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table des produits */}
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="border-b border-[#e4e9f0]">
                <th className="text-left py-2 px-2 text-xs font-semibold text-[#6b7a99]">PRODUIT</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-[#6b7a99]">QUANTITÉ</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-[#6b7a99]">PRIX UNIT.</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-[#6b7a99]">SOUS-TOTAL</th>
                <th className="text-left py-2 px-2 text-xs font-semibold text-[#6b7a99]"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-sm text-[#9aa5bf]">
                    Aucun produit dans cette vente
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.product_id} className="border-b border-[#e4e9f0]">
                    <td className="py-2 px-2">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-[#9aa5bf]">SKU: {item.sku}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQty(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 border rounded hover:bg-gray-50"
                        >-</button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 border rounded hover:bg-gray-50"
                        >+</button>
                      </div>
                    </td>
                    <td className="py-2 px-2">{fmt(item.unit_price)}</td>
                    <td className="py-2 px-2 font-semibold">{fmt(item.unit_price * item.quantity)}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => removeItem(item.product_id)} className="text-red-500">🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totaux */}
          {items.length > 0 && (
            <div className="flex justify-end mt-4">
              <div className="w-64">
                <div className="flex justify-between py-1">
                  <span className="text-[#6b7a99]">Sous-total</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#6b7a99]">TVA (10%)</span>
                  <span>{fmt(tax)}</span>
                </div>
                <div className="flex justify-between py-2 border-t font-bold">
                  <span>Total</span>
                  <span className="text-[#1e4db7]">{fmt(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#e4e9f0] px-6 py-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSave(items)} disabled={items.length === 0}>
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Invoice detail side panel ────────────────────────────────
// ── Invoice detail side panel ────────────────────────────────
function InvoicePanel({ sale, onClose, onCancel, onExport }: {
  sale: Sale; 
  onClose: () => void; 
  onCancel: () => void; 
  onExport: () => void
}) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const tax = sale.total_amount * 0.10
  
  return (
    <div className="w-96 bg-white border-l border-[#e4e9f0] flex flex-col shrink-0 overflow-auto">
      {/* Header avec croix de fermeture */}
      <div className="px-5 py-4 border-b border-[#e4e9f0] flex justify-between items-center">
        <div>
          <div className="text-[10px] font-semibold text-[#1e4db7] tracking-wide">SALE DETAILS</div>
          <div className="text-lg font-bold text-[#1a2e4a]">#INV-{String(sale.id).padStart(4,'0')}</div>
        </div>
        <div className="flex gap-2 items-center">
          <Button size="sm" icon="↓" onClick={onExport}>Export Invoice</Button>
          {/* ✅ Bouton de fermeture */}
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 hover:text-[#1a2e4a] transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-5">
        {sale.client && (
          <div className="flex items-center gap-3 bg-[#f4f6f9] rounded-xl p-3">
            <div className="w-10 h-10 rounded-xl bg-[#e4e9f0] flex items-center justify-center text-lg shrink-0">🏢</div>
            <div>
              <div className="font-semibold text-sm text-[#1a2e4a]">{sale.client.name}</div>
              <div className="text-xs text-[#9aa5bf]">Client #{sale.client.id}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-semibold text-[#6b7a99] tracking-wide mb-1">ISSUE DATE</div>
            <div className="text-sm text-[#1a2e4a]">
              {new Date(sale.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#6b7a99] tracking-wide mb-1">STATUS</div>
            <SaleBadge status={sale.status} />
          </div>
        </div>

        {sale.items && sale.items.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-[#6b7a99] tracking-wide mb-2">LINE ITEMS</div>
            <div className="flex flex-col gap-2">
              {sale.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-3 bg-[#f4f6f9] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-[#1a2e4a]">{item.product_name}</div>
                    <div className="text-xs text-[#9aa5bf]">Qty: {item.quantity} × ${item.unit_price.toFixed(2)}</div>
                  </div>
                  <div className="text-sm font-semibold">{fmt(item.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#e4e9f0] pt-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6b7a99]">Subtotal</span>
            <span className="text-[#1a2e4a]">{fmt(sale.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6b7a99]">Tax (10%)</span>
            <span className="text-[#1a2e4a]">{fmt(tax)}</span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#e4e9f0]">
            <span className="font-bold text-sm text-[#1a2e4a]">Total Amount</span>
            <span className="font-bold text-lg text-[#1e4db7]">{fmt(sale.total_amount + tax)}</span>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#e4e9f0] grid grid-cols-2 gap-2">
        <Button variant="secondary" icon="✉" size="sm" className="w-full justify-center">Resend Email</Button>
        <Button variant="secondary" icon="🖨" size="sm" className="w-full justify-center">Print</Button>
        {sale.status !== 'cancelled' && (
          <button onClick={onCancel}
            className="col-span-2 py-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition-colors border border-red-200">
            Annuler la vente
          </button>
        )}
      </div>
    </div>
  )
}

// ── Create Sale view ─────────────────────────────────────────
function CreateSale({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [clients, setClients] = useState<Client[]>([])
  const [clientId, setClientId] = useState('')
  const [note, setNote] = useState('')
  const [items, setItems] = useState<SaleCartItem[]>([])
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [payMethod, setPayMethod] = useState('Cash')
  const [transactionId] = useState(() => `TXN-${Date.now().toString().slice(-8)}`)
  

  useEffect(() => {
    api.get<{ data: Client[] }>('/clients?per_page=100')
      .then((r) => setClients(r.data.data ?? []))
      .catch(console.error)
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

  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const tax = subtotal * 0.10
  const total = subtotal + tax
  const fmt = (n: number) => `$${n.toFixed(2)}`

  const submit = async () => {
    if (!items.length) { setError('Ajoutez au moins un produit.'); return }
    setSaving(true); setError('')
    try {
      await api.post('/sales', {
        client_id: clientId || null, note: note || null,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      })
      onSuccess()
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <button onClick={onBack} className="text-[#6b7a99] text-sm mb-1 hover:text-[#1a2e4a] transition-colors flex items-center gap-1">
            ← Back to Sales & Invoices
          </button>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Create New Sale</h1>
          <p className="text-sm text-[#6b7a99]">Transaction ID: {transactionId}</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" onClick={onBack}>Draft Save</Button>
          <Button icon="🖨">Print Quote</Button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-sm text-[#1a2e4a]">
              <span>👤</span> Client & Logistics
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Select Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm bg-white outline-none focus:border-[#1e4db7]">
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

          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4 font-semibold text-sm text-[#1a2e4a]">
              <span>🛒</span> Product Selection
            </div>
            <div className="relative mb-4">
              <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-10 focus-within:border-[#1e4db7]">
                <span className="text-[#9aa5bf] text-sm">⊞</span>
                <input value={search} onChange={(e) => searchProduct(e.target.value)}
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

            {items.length > 0 ? (
              <table className="w-full border-collapse mb-3">
                <thead>
                  <tr className="border-b border-[#e4e9f0]">
                    {['PRODUCT DESCRIPTION','QTY','UNIT PRICE','SUBTOTAL',''].map((h) => (
                      <th key={h} className="text-left py-2 px-2 text-[11px] font-semibold text-[#6b7a99]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id} className="border-b border-[#e4e9f0] last:border-0">
                      <td className="py-3 px-2">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-[11px] text-[#9aa5bf]">SKU: {item.sku}</div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => updateQty(item.product_id, item.quantity-1)}
                            className="w-6 h-6 border border-[#e4e9f0] rounded text-sm hover:bg-gray-50">−</button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id, item.quantity+1)}
                            className="w-6 h-6 border border-[#e4e9f0] rounded text-sm hover:bg-gray-50">+</button>
                        </div>
                       </td>
                      <td className="py-3 px-2 text-sm">{fmt(item.unit_price)}</td>
                      <td className="py-3 px-2 text-sm font-semibold">{fmt(item.unit_price * item.quantity)}</td>
                      <td className="py-3 px-2">
                        <button onClick={() => setItems((p) => p.filter((i) => i.product_id !== item.product_id))}
                          className="text-red-400 hover:text-red-600">🗑</button>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-sm text-[#9aa5bf]">
                Recherchez un produit pour l'ajouter
              </div>
            )}
          </div>

          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <label className="text-sm font-medium block mb-2">Note (optionnel)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              className="w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none resize-none focus:border-[#1e4db7]" />
          </div>
        </div>

        <div className="sticky top-0 flex flex-col gap-3">
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="font-semibold text-sm mb-1">Invoice Summary</div>
            <div className="text-xs text-[#6b7a99] mb-5">Review totals before generation</div>
            {[['Subtotal', fmt(subtotal)],['Discount (0%)','-$0.00'],['Tax (VAT 10%)', fmt(tax)]].map(([l,v]) => (
              <div key={l} className="flex justify-between text-sm mb-2.5">
                <span className="text-[#6b7a99]">{l}</span><span>{v}</span>
              </div>
            ))}
            <div className="border-t border-[#e4e9f0] pt-3 mt-1">
              <div className="text-[11px] font-semibold text-[#6b7a99] mb-1">GRAND TOTAL</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-[#1e4db7]">{fmt(total)}</span>
                <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[11px] font-medium">PENDING</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-xs font-medium text-[#6b7a99] mb-2">Payment Method</div>
              <div className="flex gap-2">
                {['Cash','Card','Transfer'].map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors
                      ${payMethod===m ? 'bg-[#e8f0fe] text-[#1e4db7] border-[#1e4db7]' : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs mt-3">{error}</div>}
            <button onClick={() => submit()} disabled={saving || !items.length}
              className={`w-full mt-4 py-3 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2
                ${!items.length ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1e4db7] hover:bg-[#1a3fa0]'}`}>
              🧾 {saving ? 'Création...' : 'Generate Invoice'}
            </button>
          </div>
          {items.length > 0 && (
            <div className="bg-[#e8f0fe] border border-[#bfcfef] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[#1e4db7]">ℹ</span>
                <span className="font-semibold text-sm text-[#1e4db7]">Stock Availability</span>
              </div>
              <p className="text-xs text-[#6b7a99] leading-relaxed">
                All items are currently in stock. Estimated delivery: 2 business days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Sales List ──────────────────────────────────────────
export default function SalesPage() {
  const [view, setView] = useState<'list' | 'create'>('list')
  const [sales, setSales] = useState<Sale[]>([])
  const [selected, setSelected] = useState<Sale | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [meta, setMeta] = useState<{ total: number; total_pages: number; has_next: boolean }>({ total:0, total_pages:1, has_next:false })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { isAdmin, isManager } = usePermissions()
  const [showFilterPanel, setShowFilterPanel] = useState(false) 

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' })
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get<{ data: Sale[]; meta: typeof meta }>(`/sales?${params.toString()}`)
      setSales(res.data.data ?? [])
      setMeta(res.data.meta ?? { total:0, total_pages:1, has_next:false })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, dateFrom, dateTo, statusFilter])

  useEffect(() => {
    const fetchData = async () => {
      if (view === 'list') {
        await load()
      }
    }
    fetchData().catch(console.error)
  }, [load, view])

  const selectSale = async (s: Sale) => {
    try {
      const res = await api.get<{ data: Sale }>(`/sales/${s.id}`)
      setSelected(res.data.data)
    } catch { setSelected(s) }
  }

  const cancelSale = async () => {
    if (!selected) return
    if (!window.confirm('Annuler cette vente ?')) return
    try {
      await api.patch(`/sales/${selected.id}/status`, { status: 'cancelled' })
      setSelected(null)
      await load()
    } catch (e: unknown) {
      alert((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur')
    }
  }

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale)
    setShowEditModal(true)
  }

  const saveSaleChanges = async (updatedItems: SaleCartItem[]) => {
    if (!editingSale) return
    
    try {
      await api.put(`/sales/${editingSale.id}`, {
        items: updatedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      })
      setShowEditModal(false)
      setEditingSale(null)
      await load()
      alert('✅ Vente modifiée avec succès')
    } catch (error) {
      console.error('Error updating sale:', error)
      alert('❌ Erreur lors de la modification')
    }
  }

  const exportAllToCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (statusFilter) params.set('status', statusFilter)
      params.set('per_page', '1000')
      
      const response = await api.get<{ data: Sale[] }>(`/sales?${params.toString()}`)
      const allSales = response.data.data || []
      
      const headers = ['ID', 'Client', 'Date', 'Total', 'Status']
      const rows = allSales.map((sale: Sale) => [
        `#INV-${String(sale.id).padStart(5, '0')}`,
        sale.client?.name || 'Walk-in',
        new Date(sale.sale_date).toLocaleDateString('fr-FR'),
        sale.total_amount,
        sale.status
      ])
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number)[]) => row.map((cell: string | number) => `"${cell}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('✅ Export CSV réussi !')
    } catch (error) {
      console.error('Export error:', error)
      alert('❌ Erreur lors de l\'export CSV')
    }
  }

  const exportSingleInvoice = async (sale: Sale) => {
    try {
      const headers = ['Product', 'Quantity', 'Unit Price', 'Subtotal']
      const rows = sale.items?.map((item) => [
        item.product_name,
        item.quantity,
        item.unit_price,
        item.subtotal
      ]) || []
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: (string | number | null)[]) => row.map((cell: string | number | null) => `"${cell ?? ''}"`).join(','))
      ].join('\n')
      
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `invoice_${String(sale.id).padStart(5, '0')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('✅ Facture exportée !')
    } catch (error) {
      console.error('Export error:', error)
      alert('❌ Erreur lors de l\'export')
    }
  }

  if (view === 'create') {
    return <CreateSale onBack={() => setView('list')} onSuccess={() => { setView('list'); load() }} />
  }

  const totalRev = sales.reduce((s, sale) => s + sale.total_amount, 0)
  const pendingAmt = sales.filter((s) => s.status === 'pending').reduce((acc, s) => acc + s.total_amount, 0)
  const cancelledAmt = sales.filter((s) => s.status === 'cancelled').reduce((acc, s) => acc + s.total_amount, 0)

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e4a]">Sales & Invoices</h1>
            <p className="text-sm text-[#6b7a99] mt-0.5">Manage your transactional history and financial records.</p>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary" icon="≡" onClick={() => setShowFilterPanel(!showFilterPanel)}>Filter {showFilterPanel ? '▲' : '▼'}</Button>
            {showFilterPanel && (
  <div className="bg-white border border-[#e4e9f0] rounded-xl p-4 mb-4 grid grid-cols-4 gap-4">
    <div>
      <label className="block text-xs font-medium text-[#6b7a99] mb-1">Date début</label>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
        className="w-full px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-[#6b7a99] mb-1">Date fin</label>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
        className="w-full px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm"
      />
    </div>
    <div>
      <label className="block text-xs font-medium text-[#6b7a99] mb-1">Statut</label>
      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        className="w-full px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white"
      >
        <option value="">Tous</option>
        <option value="pending">En attente</option>
        <option value="completed">Terminé</option>
        <option value="cancelled">Annulé</option>
      </select>
    </div>
    <div className="flex items-end">
      <button
        onClick={() => {
          setDateFrom('')
          setDateTo('')
          setStatusFilter('')
          setPage(1)
          setShowFilterPanel(false)
        }}
        className="w-full py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
      >
        Réinitialiser
      </button>
    </div>
  </div>
)}
            <Button variant="secondary" icon="↓" onClick={exportAllToCSV}>Export All</Button>
            <Button icon="⊕" onClick={() => setView('create')}>New Sale</Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: 'TOTAL REVENUE', value: fmt(totalRev), color: 'text-[#1e4db7]' },
            { label: 'PENDING AMOUNT', value: fmt(pendingAmt), color: 'text-amber-600' },
            { label: 'CANCELLED', value: fmt(cancelledAmt), color: 'text-red-600' },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl px-5 py-4">
              <div className="text-[10px] font-semibold text-[#6b7a99] tracking-wide mb-2">{k.label}</div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center flex-wrap">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
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
          <button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setPage(1) }}
            className="px-3 py-2 text-sm text-[#6b7a99] hover:bg-gray-50 rounded-lg transition-colors border border-[#e4e9f0]">
            Reset
          </button>
          <div className="ml-auto flex gap-1.5">
            {['Compact', 'Relaxed'].map((d) => (
              <button key={d} className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${d === 'Compact' ? 'bg-[#e8f0fe] text-[#1e4db7] border-[#e8f0fe]' : 'bg-white text-[#9aa5bf] border-[#e4e9f0]'}`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">INVOICE ID</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">CLIENT</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">DATE</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">AMOUNT</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">STATUS</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : sales.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-sm text-[#9aa5bf]">Aucune vente trouvée</td></tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.id} onClick={() => selectSale(s)}
                      className={`border-b border-[#e4e9f0] last:border-0 cursor-pointer transition-colors border-l-2
                        ${selected?.id === s.id ? 'bg-blue-50 border-l-[#1e4db7]' : 'hover:bg-gray-50/60 border-l-transparent'}`}>
                      <td className="px-4 py-4">
                        <div className="text-[#1e4db7] font-semibold text-sm">#INV-{String(s.id).padStart(4, '0')}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-sm text-[#1a2e4a]">{s.client?.name ?? 'Walk-in'}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#6b7a99]">
                        {new Date(s.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">{fmt(s.total_amount)}</td>
                      <td className="px-4 py-4"><SaleBadge status={s.status} /></td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          {s.status === 'pending' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditSale(s)
                              }}
                              className="text-amber-600 hover:text-amber-800 transition-colors"
                              title="Modifier la vente"
                            >
                              ✏️
                            </button>
                          )}
                          {(isAdmin || isManager) && s.status !== 'cancelled' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelSale()
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Annuler la vente"
                            >
                              ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {meta.total > 0 && (
            <Pagination page={page} totalPages={meta.total_pages} total={meta.total} perPage={10} onChange={setPage} />
          )}
        </div>
      </div>

      {selected && (
        <InvoicePanel 
          sale={selected} 
          onClose={() => setSelected(null)} 
          onCancel={cancelSale}
          onExport={() => exportSingleInvoice(selected)}
        />
      )}

      {showEditModal && editingSale && (
      <EditSaleModal
    sale={editingSale}
    onClose={() => setShowEditModal(false)}
    onSave={saveSaleChanges}
  />
)}
    </div>
  )
}