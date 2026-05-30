// src/pages/shared/InventoryPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'
import { Badge } from '../../components/UI/Badge'
import { Modal } from '../../components/UI/Modal'
import { usePermissions } from '../../hooks/usePermissions'

// ============================================================
// TYPES
// ============================================================
interface Movement {
  id: number
  product_id: number
  product_name: string
  product_sku: string
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  note: string
  created_at: string
}

interface StockStats {
  low_stock_count: number
  out_of_stock_count: number
  total_inventory_value: number
  low_stock_products: LowStockProduct[]
}

interface LowStockProduct {
  id: number
  name: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  price: number
}

interface Product {
  id: number
  name: string
  sku: string
  price: number
  stock_quantity: number
  low_stock_threshold: number
  description?: string
}

interface MovementsResponse {
  data: Movement[]
  meta: {
    total: number
    total_pages: number
    page: number
    per_page: number
  }
}

interface ProductsResponse {
  data: Product[]
  meta?: {
    total: number
    total_pages: number
  }
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string
    }
  }
}

// ============================================================
// COMPOSANT
// ============================================================
export default function InventoryPage() {
  const { canManageStock } = usePermissions()
  
  // State
  const [movements, setMovements] = useState<Movement[]>([])
  const [stats, setStats] = useState<StockStats | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [filterType, setFilterType] = useState<string>('')
  const [showAddStockModal, setShowAddStockModal] = useState<boolean>(false)
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)
  
  // Form state
  const [stockForm, setStockForm] = useState({
    product_id: '',
    quantity: '',
    note: ''
  })
  
  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    new_quantity: '',
    note: ''
  })

  // ============================================================
  // API CALLS
  // ============================================================
  const fetchMovements = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: '20'
      })
      if (filterType) {
        params.set('type', filterType)
      }
      
      const res = await api.get<MovementsResponse>(`/stock/movements?${params.toString()}`)
      setMovements(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
    } catch (error) {
      console.error('Error fetching movements:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filterType])

  const fetchStats = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<StockStats>('/stock/stats')
      setStats(res.data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  const fetchProducts = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get<ProductsResponse>('/products?per_page=100')
      setProducts(res.data.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [])

  // Load all data
  useEffect(() => {
    const loadData = async (): Promise<void> => {
      await Promise.all([
        fetchMovements(),
        fetchStats(),
        fetchProducts()
      ])
    }
    loadData()
  }, [fetchMovements, fetchStats, fetchProducts])

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleAddStock = async (): Promise<void> => {
    if (!stockForm.product_id || !stockForm.quantity) {
      alert('Veuillez sélectionner un produit et entrer une quantité')
      return
    }
    
    setSubmitting(true)
    try {
      await api.post('/stock/add', {
        product_id: parseInt(stockForm.product_id),
        quantity: parseInt(stockForm.quantity),
        note: stockForm.note || 'Stock ajouté manuellement'
      })
      setShowAddStockModal(false)
      setStockForm({ product_id: '', quantity: '', note: '' })
      await Promise.all([fetchMovements(), fetchStats()])
      alert('Stock ajouté avec succès ✅')
    } catch (error) {
      const apiError = error as ApiErrorResponse
      alert(apiError.response?.data?.message || 'Erreur lors de l\'ajout')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustStock = async (): Promise<void> => {
    if (!adjustForm.product_id || adjustForm.new_quantity === '') {
      alert('Veuillez sélectionner un produit et entrer la nouvelle quantité')
      return
    }
    
    setSubmitting(true)
    try {
      await api.post('/stock/adjust', {
        product_id: parseInt(adjustForm.product_id),
        new_quantity: parseInt(adjustForm.new_quantity),
        note: adjustForm.note || 'Ajustement manuel'
      })
      setShowAdjustModal(false)
      setAdjustForm({ product_id: '', new_quantity: '', note: '' })
      await Promise.all([fetchMovements(), fetchStats()])
      alert('Stock ajusté avec succès ✅')
    } catch (error) {
      const apiError = error as ApiErrorResponse
      alert(apiError.response?.data?.message || 'Erreur lors de l\'ajustement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFilterChange = (value: string): void => {
    setFilterType(value)
    setPage(1)
  }

  const handlePageChange = (newPage: number): void => {
    setPage(newPage)
  }

  // ============================================================
  // UTILS
  // ============================================================
  const getTypeIcon = (type: string): string => {
    switch(type) {
      case 'IN': return '➕'
      case 'OUT': return '➖'
      default: return '📝'
    }
  }

  const getTypeLabel = (type: string): string => {
    switch(type) {
      case 'IN': return 'Entrée'
      case 'OUT': return 'Sortie'
      default: return 'Ajustement'
    }
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Stock Movements</h1>
          <p className="text-[#6b7a99] text-sm mt-0.5">Track all inventory changes and movements</p>
        </div>
        <div className="flex gap-2.5">
          {canManageStock && (
            <>
              <Button 
                variant="secondary" 
                icon="➕" 
                onClick={() => setShowAddStockModal(true)}
              >
                Add Stock
              </Button>
              <Button 
                variant="secondary" 
                icon="📝" 
                onClick={() => setShowAdjustModal(true)}
              >
                Adjust Stock
              </Button>
            </>
          )}
          <Button icon="📊">Export Report</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">⚠️</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Low Stock</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">{stats?.low_stock_count || 0}</div>
              <div className="text-xs text-amber-600 mt-1">Below threshold</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-2xl">🚫</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Out of Stock</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">{stats?.out_of_stock_count || 0}</div>
              <div className="text-xs text-red-600 mt-1">Need restocking</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#e4e9f0]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl">💰</div>
            <div>
              <div className="text-xs text-[#6b7a99] uppercase tracking-wide">Inventory Value</div>
              <div className="text-2xl font-bold text-[#1a2e4a]">
                ${(stats?.total_inventory_value || 0).toLocaleString()}
              </div>
              <div className="text-xs text-green-600 mt-1">Total stock value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 mb-4 flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#6b7a99]">Filter by type:</span>
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-1.5 border border-[#e4e9f0] rounded-lg text-sm bg-white outline-none focus:border-[#1e4db7]"
          >
            <option value="">All</option>
            <option value="IN">Entrées</option>
            <option value="OUT">Sorties</option>
            <option value="ADJUSTMENT">Ajustements</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-[#6b7a99]">
          Showing {movements.length} movements
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-[#e4e9f0]">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">DATE</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">PRODUCT</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">TYPE</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">QUANTITY</th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-[#6b7a99] uppercase tracking-wide">NOTE</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-[#9aa5bf]">
                    No stock movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="border-b border-[#e4e9f0] hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6 text-sm text-[#6b7a99] whitespace-nowrap">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-medium text-sm text-[#1a2e4a]">{movement.product_name}</div>
                        <div className="text-xs text-[#9aa5bf] font-mono">{movement.product_sku}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant="info" size="sm">
                        <span className="flex items-center gap-1">
                          <span>{getTypeIcon(movement.movement_type)}</span>
                          <span>{getTypeLabel(movement.movement_type)}</span>
                        </span>
                      </Badge>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`font-semibold text-sm ${
                        movement.movement_type === 'IN' ? 'text-green-600' : 
                        movement.movement_type === 'OUT' ? 'text-red-600' : 
                        'text-yellow-600'
                      }`}>
                        {movement.movement_type === 'IN' ? '+' : movement.movement_type === 'OUT' ? '-' : '±'}
                        {movement.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm text-[#6b7a99] max-w-xs truncate">
                      {movement.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-[#e4e9f0] flex justify-between items-center">
            <div className="text-xs text-[#6b7a99]">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-[#e4e9f0] rounded-md text-sm text-[#6b7a99] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-[#e4e9f0] rounded-md text-sm text-[#6b7a99] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Low Stock Products Alert */}
      {stats?.low_stock_products && stats.low_stock_products.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-semibold text-[#1a2e4a]">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {stats.low_stock_products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <div>
                  <div className="font-medium text-sm">{product.name}</div>
                  <div className="text-xs text-[#6b7a99]">SKU: {product.sku}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-red-600">{product.stock_quantity} units</div>
                  <div className="text-xs text-[#6b7a99]">Threshold: {product.low_stock_threshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      <Modal
        title="Ajouter du Stock"
        open={showAddStockModal}
        onClose={() => setShowAddStockModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddStockModal(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleAddStock}>Ajouter</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Produit *</label>
            <select
              value={stockForm.product_id}
              onChange={(e) => setStockForm({...stockForm, product_id: e.target.value})}
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7]"
            >
              <option value="">Sélectionner un produit</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - Stock actuel: {p.stock_quantity}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Quantité à ajouter *</label>
            <input
              type="number"
              value={stockForm.quantity}
              onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
              placeholder="0"
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Note (optionnelle)</label>
            <textarea
              value={stockForm.note}
              onChange={(e) => setStockForm({...stockForm, note: e.target.value})}
              placeholder="Raison de l'ajout..."
              rows={2}
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7] resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        title="Ajuster le Stock"
        open={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>Annuler</Button>
            <Button loading={submitting} onClick={handleAdjustStock}>Ajuster</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Produit *</label>
            <select
              value={adjustForm.product_id}
              onChange={(e) => {
                const product = products.find(p => p.id === parseInt(e.target.value))
                setAdjustForm({...adjustForm, product_id: e.target.value})
                if (product) {
                  setSelectedProduct(product)
                }
              }}
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7]"
            >
              <option value="">Sélectionner un produit</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - Stock actuel: {p.stock_quantity}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Nouvelle quantité *</label>
            <input
              type="number"
              value={adjustForm.new_quantity}
              onChange={(e) => setAdjustForm({...adjustForm, new_quantity: e.target.value})}
              placeholder="0"
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7]"
            />
            {selectedProduct && (
              <p className="text-xs text-[#6b7a99] mt-1">
                Stock actuel: {selectedProduct.stock_quantity} → Nouveau: {adjustForm.new_quantity || 0}
                ({parseInt(adjustForm.new_quantity || '0') - selectedProduct.stock_quantity > 0 ? '+' : ''}
                {parseInt(adjustForm.new_quantity || '0') - selectedProduct.stock_quantity})
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Note (optionnelle)</label>
            <textarea
              value={adjustForm.note}
              onChange={(e) => setAdjustForm({...adjustForm, note: e.target.value})}
              placeholder="Raison de l'ajustement..."
              rows={2}
              className="w-full border border-[#e4e9f0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e4db7] resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}