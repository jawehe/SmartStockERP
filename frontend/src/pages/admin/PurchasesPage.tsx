// src/pages/admin/PurchasesPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'
import { Modal } from '../../components/UI/Modal'
import { Pagination } from '../../components/UI/Table'

interface PurchaseItem {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  unit_cost: number
  subtotal: number
}

interface Purchase {
  id: number
  supplier_id: number
  supplier_name: string
  total_amount: number
  status: string
  created_at: string
  received_at: string | null
  items_count: number
  items?: PurchaseItem[]
}

interface Supplier {
  id: number
  name: string
}

interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock_quantity: number
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [form, setForm] = useState({
    supplier_id: '',
    items: [] as { product_id: string; quantity: string; unit_cost: string }[]
  })
  const [currentItem, setCurrentItem] = useState({ product_id: '', quantity: '', unit_cost: '' })
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' })
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get(`/purchases?${params.toString()}`)
      setPurchases(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await api.get('/suppliers?per_page=100')
      setSuppliers(res.data.data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get('/products?per_page=100')
      setProducts(res.data.data || [])
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([loadPurchases(), loadSuppliers(), loadProducts()])
    }
    fetchData()
  }, [loadPurchases, loadSuppliers, loadProducts])

  const addItem = () => {
    if (!currentItem.product_id || !currentItem.quantity || !currentItem.unit_cost) {
      alert('Veuillez remplir tous les champs du produit')
      return
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: currentItem.product_id,
        quantity: currentItem.quantity,
        unit_cost: currentItem.unit_cost
      }]
    }))
    setCurrentItem({ product_id: '', quantity: '', unit_cost: '' })
  }

  const removeItem = (index: number) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    if (!form.supplier_id) {
      alert('Veuillez sélectionner un fournisseur')
      return
    }
    if (form.items.length === 0) {
      alert('Veuillez ajouter au moins un produit')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/purchases', {
        supplier_id: parseInt(form.supplier_id),
        items: form.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity),
          unit_cost: parseFloat(item.unit_cost)
        }))
      })
      setShowModal(false)
      setForm({ supplier_id: '', items: [] })
      await loadPurchases()
      alert('✅ Achat créé avec succès')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      alert(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSubmitting(false)
    }
  }

  const viewPurchaseDetails = async (purchase: Purchase) => {
    try {
      const res = await api.get(`/purchases/${purchase.id}`)
      setSelectedPurchase(res.data.data)
    } catch (error) {
      console.error('Error loading purchase details:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      received: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-600 border-red-200'
    }
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      received: '✅ Reçu',
      cancelled: '❌ Annulé'
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status] || status}
      </span>
    )
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + p.total_amount, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Purchases Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Track all supplier purchases and inventory replenishment</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="↓">Export All</Button>
          <Button icon="+" onClick={() => { setShowModal(true); setForm({ supplier_id: '', items: [] }) }}>
            New Purchase
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">📦</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Total Purchases</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">{purchases.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">💰</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Total Amount</div>
              <div className="text-2xl font-bold text-[#1e4db7]">{fmt(totalPurchases)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">🏭</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Suppliers</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">{suppliers.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-2xl">⭐</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Avg. Purchase</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">
                {purchases.length > 0 ? fmt(totalPurchases / purchases.length) : '$0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={() => { setStatusFilter(''); setPage(1) }}
          className="px-3 py-2 text-sm text-[#6b7a99] hover:bg-gray-50 rounded-lg transition-colors border border-[#e4e9f0]"
        >
          Reset
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">PURCHASE ID</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">SUPPLIER</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">DATE</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">ITEMS</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">TOTAL</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">STATUS</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
                  </div>
                </td></tr>
              ) : purchases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-[#9aa5bf]">No purchases found</td></tr>
              ) : (
                purchases.map((purchase) => (
                  <tr
                    key={purchase.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => viewPurchaseDetails(purchase)}
                  >
                    <td className="py-3 px-6 font-mono text-sm text-[#1e4db7]">
                      #PO-{String(purchase.id).padStart(5, '0')}
                    </td>
                    <td className="py-3 px-6 font-medium">{purchase.supplier_name}</td>
                    <td className="py-3 px-6 text-sm text-[#6b7a99]">
                      {new Date(purchase.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-6 text-sm">{purchase.items_count} products</td>
                    <td className="py-3 px-6 font-semibold">{fmt(purchase.total_amount)}</td>
                    <td className="py-3 px-6">{getStatusBadge(purchase.status)}</td>
                    <td className="py-3 px-6">
                      <button
                        onClick={(e) => { e.stopPropagation(); viewPurchaseDetails(purchase) }}
                        className="text-[#1e4db7] hover:text-[#1a3fa0]"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={purchases.length} perPage={10} onChange={setPage} />
        )}
      </div>

      {/* Modal création achat */}
      <Modal
        title="New Purchase Order"
        open={showModal}
        onClose={() => setShowModal(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button loading={submitting} onClick={handleSubmit}>Create Purchase</Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Sélection fournisseur */}
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Supplier *</label>
            <select
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              className="w-full p-2 border border-[#e4e9f0] rounded-lg focus:outline-none focus:border-[#1e4db7]"
            >
              <option value="">Select a supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Ajout produit */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm mb-3">Add Products</h3>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <select
                value={currentItem.product_id}
                onChange={(e) => setCurrentItem({ ...currentItem, product_id: e.target.value })}
                className="col-span-2 p-2 border border-[#e4e9f0] rounded-lg text-sm"
              >
                <option value="">Select product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Quantity"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                className="p-2 border border-[#e4e9f0] rounded-lg text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Unit cost"
                value={currentItem.unit_cost}
                onChange={(e) => setCurrentItem({ ...currentItem, unit_cost: e.target.value })}
                className="p-2 border border-[#e4e9f0] rounded-lg text-sm"
              />
            </div>
            <Button size="sm" onClick={addItem}>+ Add Item</Button>
          </div>

          {/* Liste des produits */}
          {form.items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2 text-left">Unit Cost</th>
                    <th className="p-2 text-left">Subtotal</th>
                    <th className="p-2 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, idx) => {
                    const product = products.find(p => p.id === parseInt(item.product_id))
                    const subtotal = parseFloat(item.quantity) * parseFloat(item.unit_cost)
                    return (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{product?.name || `Product #${item.product_id}`}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">${parseFloat(item.unit_cost).toFixed(2)}</td>
                        <td className="p-2 font-semibold">${subtotal.toFixed(2)}</td>
                        <td className="p-2">
                          <button onClick={() => removeItem(idx)} className="text-red-500">🗑</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={3} className="p-2 text-right font-semibold">Total:</td>
                    <td className="p-2 font-bold text-[#1e4db7]">
                      ${form.items.reduce((sum, item) => 
                        sum + (parseFloat(item.quantity) * parseFloat(item.unit_cost)), 0
                      ).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal détails achat */}
      {selectedPurchase && (
        <Modal
          title={`Purchase Order #PO-${String(selectedPurchase.id).padStart(5, '0')}`}
          open={!!selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs text-[#6b7a99]">Supplier</div>
                <div className="font-semibold">{selectedPurchase.supplier_name}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b7a99]">Date</div>
                <div>{new Date(selectedPurchase.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b7a99]">Status</div>
                <div>{getStatusBadge(selectedPurchase.status)}</div>
              </div>
              <div>
                <div className="text-xs text-[#6b7a99]">Total Amount</div>
                <div className="text-xl font-bold text-[#1e4db7]">{fmt(selectedPurchase.total_amount)}</div>
              </div>
            </div>

            <h3 className="font-semibold">Items</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Quantity</th>
                  <th className="p-2 text-left">Unit Cost</th>
                  <th className="p-2 text-left">Subtotal</th>
                 </tr>
              </thead>
              <tbody>
                {selectedPurchase.items?.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{item.product_name}</td>
                    <td className="p-2 text-xs text-[#6b7a99]">{item.product_sku}</td>
                    <td className="p-2">{item.quantity}</td>
                    <td className="p-2">{fmt(item.unit_cost)}</td>
                    <td className="p-2">{fmt(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
             </table>
          </div>
        </Modal>
      )}
    </div>
  )
}