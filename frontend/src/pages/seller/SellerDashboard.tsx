// src/pages/seller/SellerDashboard.tsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { DashboardStats, Product, Sale } from '../../types/index'
import { Button } from '../../components/UI/Button'

interface Invoice { id: string; client: string; amount: number; status: 'Processed' | 'Pending' }

export default function SellerDashboard() {
  const [stats, setStats]       = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales]       = useState<Sale[]>([])
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const navigate                = useNavigate()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const MOCK_INVOICES: Invoice[] = [
    { id: 'INV-8829', client: 'Global Tech Solutions', amount: 3120, status: 'Processed' },
    { id: 'INV-8830', client: 'Design Flow Ltd.',      amount: 845.2, status: 'Processed' },
    { id: 'INV-8831', client: 'Michael Chen (Walk-in)',amount: 120, status: 'Pending' },
  ]

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p, sl] = await Promise.all([
        api.get<{ data: DashboardStats }>('/dashboard/stats?period=7d'),
        api.get<{ data: Product[] }>('/products?per_page=8'),
        api.get<{ data: Sale[] }>('/sales?per_page=5'),
      ])
      setStats(s.data.data)
      setProducts(p.data.data ?? [])
      setSales(sl.data.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load().catch(console.error) }, [load])

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  )

  // Daily target mock
  const todayRev = stats?.sales.revenue ?? 0
  const target   = 17000
  const targetPct = Math.min(Math.round((todayRev / target) * 100), 100)

  return (
    <div>
      {/* Blue hero banner */}
      <div className="bg-gradient-to-r from-[#1e4db7] to-[#1565c0] rounded-2xl p-7 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full opacity-10">
          <div className="w-full h-full bg-white rounded-full transform translate-x-1/3 -translate-y-1/3" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Empower Your Sales Cycle</h1>
        <p className="text-white/70 text-sm mb-5 max-w-lg">
          Manage transactions, track inventory, and generate professional invoices in real-time. Ready to close the next deal?
        </p>
        <button onClick={() => navigate('/sales')}
          className="flex items-center gap-2 bg-white text-[#1e4db7] px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
          ⚡ Quick Sale Action
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:"TODAY'S REVENUE", value: fmt(stats?.sales.revenue ?? 0),    sub:'+12.5%', subColor:'#16a34a', icon:'💰' },
          { label:'TOTAL ORDERS',    value: `${stats?.sales.count ?? 0} Units`, sub:'-2.1%',  subColor:'#dc2626', icon:'🛒' },
          { label:'AVG. ORDER VALUE',value: fmt(stats?.sales.avg_basket ?? 0), sub:'+8.4%',  subColor:'#16a34a', icon:'📈' },
          { label:'STOCK ALERTS',    value: `${stats?.inventory.low_stock_count ?? 0} Items Low`, sub:'', subColor:'', icon:'⚠️' },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 bg-[#f0f4ff] rounded-xl flex items-center justify-center text-xl">{k.icon}</div>
              {k.sub && (
                <span className={`text-xs font-semibold ${k.subColor === '#16a34a' ? 'text-green-600' : 'text-red-500'}`}>
                  {k.sub}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#6b7a99] uppercase tracking-wide mb-1">{k.label}</div>
            <div className="text-xl font-bold text-[#1a2e4a]">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Left — Product Quick Search */}
        <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold text-sm text-[#1a2e4a]">Product Quick Search</div>
            <div className="flex gap-2">
              {['Compact','Relaxed'].map((d) => (
                <button key={d} className="px-3 py-1 border border-[#e4e9f0] rounded-md text-xs hover:bg-gray-50 transition-colors">{d}</button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-10 mb-4 focus-within:border-[#1e4db7] transition-colors">
            <span className="text-[#9aa5bf] text-sm">≡</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU, Name or Barcode..."
              className="flex-1 border-none outline-none text-sm" />
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_80px_100px_50px] gap-2 px-2 mb-2">
            {['PRODUCT INFO','PRICE','STATUS','ACTION'].map((h) => (
              <div key={h} className="text-[10px] font-semibold text-[#6b7a99] tracking-wide">{h}</div>
            ))}
          </div>

          {/* Products list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#e4e9f0]">
              {filtered.slice(0,5).map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_80px_100px_50px] gap-2 items-center py-3 px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-base shrink-0">📦</div>
                    <div>
                      <div className="font-medium text-sm text-[#1a2e4a] leading-tight">{p.name}</div>
                      <div className="text-[11px] text-[#9aa5bf]">SKU: {p.sku}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium">${Number(p.price).toFixed(2)}</div>
                  <div>
                    {p.stock_quantity === 0 ? (
                      <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">OUT OF STOCK</span>
                    ) : p.is_low_stock ? (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        LOW STOCK ({p.stock_quantity})
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">IN STOCK</span>
                    )}
                  </div>
                  <button onClick={() => navigate('/sales')}
                    className="w-8 h-8 bg-[#f0f4ff] hover:bg-[#1e4db7] text-[#1e4db7] hover:text-white rounded-lg transition-colors flex items-center justify-center text-sm font-bold">
                    🛒
                  </button>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-sm text-[#9aa5bf]">Aucun produit trouvé</div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Recent Invoices */}
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-sm text-[#1a2e4a]">Recent Invoices</div>
              <button onClick={() => navigate('/sales')} className="text-xs text-[#1e4db7] font-medium hover:underline">View All</button>
            </div>
            <div className="flex flex-col gap-3">
              {MOCK_INVOICES.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 p-3 border border-[#e4e9f0] rounded-lg hover:border-[#1e4db7] transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-base shrink-0">🧾</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-[#1a2e4a]">{inv.id}</div>
                    <div className="text-xs text-[#9aa5bf] truncate">{inv.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">${inv.amount.toFixed(2)}</div>
                    <div className={`text-[10px] font-medium ${inv.status === 'Processed' ? 'text-blue-600' : 'text-amber-600'}`}>
                      {inv.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Performance widget */}
          <div className="bg-[#1a2e4a] rounded-xl p-5 text-white">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs font-semibold text-white/60 tracking-wide">SALES PERFORMANCE</div>
              <span className="text-lg">✨</span>
            </div>
            <div className="text-2xl font-bold mb-2">{targetPct}% of Target</div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-[#1e4db7] rounded-full transition-all" style={{ width: `${targetPct}%` }} />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              You're just {fmt(Math.max(target - todayRev, 0))} away from your daily goal! Keep up the momentum.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
