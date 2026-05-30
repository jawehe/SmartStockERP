// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { DashboardStats, RevenuePoint, Sale } from '../../types/index'
import { StatusBadge } from '../../components/UI/Badge'
import { Button } from '../../components/UI/Button'

type Period = '7d' | '30d' | '90d' | '1y'

function KPICard({ label, value, sub, subColor, icon, urgent }: {
  label: string; value: string | number; sub?: string
  subColor?: string; icon: string; urgent?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 flex items-start gap-4 border ${urgent ? 'border-red-200' : 'border-[#e4e9f0]'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${urgent ? 'bg-red-50' : 'bg-[#f0f4ff]'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {sub && <div className="text-xs font-semibold mb-1" style={{ color: subColor ?? '#16a34a' }}>{sub}</div>}
        <div className="text-xs text-[#6b7a99] mb-1 uppercase tracking-wide">{label}</div>
        <div className={`text-2xl font-bold ${urgent ? 'text-red-600' : 'text-[#1a2e4a]'}`}>{value}</div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]     = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [sales, setSales]     = useState<Sale[]>([])
  const [period, setPeriod]   = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, sl] = await Promise.all([
        api.get<{ data: DashboardStats }>(`/dashboard/stats?period=${period}`),
        api.get<{ data: RevenuePoint[] }>(`/dashboard/revenue?period=${period}`),
        api.get<{ data: Sale[] }>('/sales?per_page=5'),
      ])
      setStats(s.data.data)
      setRevenue(r.data.data ?? [])
      setSales(sl.data.data ?? [])
  } catch (e) {
  console.error('DASHBOARD ERROR:', e)
}
    finally { setLoading(false) }
  }, [period])

useEffect(() => {
  const fetchData = async () => {
    await load()
  }

  fetchData().catch(console.error)
}, [load])

  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)
  const PERIODS: Period[] = ['7d', '30d', '90d', '1y']

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Executive Dashboard</h1>
          <p className="text-[#6b7a99] text-sm mt-0.5">Real-time overview of SmartStock Enterprise performance.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="↓">Export Report</Button>
          <Button icon="↺" onClick={() => load().catch(console.error)}>Refresh Data</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard icon="💰" label="Total Revenue"
              value={fmt(stats?.sales?.revenue ?? 0)}
              sub={stats?.sales?.growth_pct ? `+${stats.sales.growth_pct}% ↑` : 'Current'}
              subColor="#16a34a" />
            <KPICard icon="📦" label="Inventory Value"
              value={`${stats?.inventory?.total_products ?? 0} SKUs`}
              sub="Current" subColor="#6b7a99" />
            <KPICard icon="🧾" label="Pending Orders"
              value={stats?.sales.count ?? 0}
              sub="Urgent" subColor="#dc2626" urgent />
            <KPICard icon="👥" label="New Clients"
              value={stats?.clients_count ?? 0}
              sub="+8 ↑" subColor="#16a34a" />
          </div>

          {/* Chart + Alerts grid */}
          <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">
            {/* Revenue chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <div className="font-semibold text-base text-[#1a2e4a]">Revenue Growth</div>
                  <div className="text-xs text-[#6b7a99]">Monthly performance tracking vs previous year</div>
                </div>
                <div className="flex gap-1.5">
                  {PERIODS.map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border
                        ${period === p ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
                      {p === '7d' ? '1M' : p === '30d' ? '6M' : p === '90d' ? '3M' : '1Y'}
                    </button>
                  ))}
                </div>
              </div>
              {revenue.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-[#9aa5bf]">
                  Interactive Chart Data Loading...
                </div>
              ) : (
                <div className="flex items-end gap-0.5 h-44">
                  {revenue.map((r, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t"
                        style={{
                          height: `${Math.max((r.revenue / maxRev) * 160, 4)}px`,
                          background: `rgba(30,77,183,${0.35 + (i / revenue.length) * 0.65})`,
                          minHeight: 4,
                        }}
                        title={`${r.date}: ${fmt(r.revenue)}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock alerts */}
            <div className="bg-white border-2 border-red-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">⚠️</span>
                <div className="font-semibold text-[#dc2626]">Low Stock Alerts</div>
              </div>
              <div className="text-xs text-[#6b7a99] mb-4">
                {stats?.inventory?.low_stock_count ?? 0} items requiring replenishment
              </div>
              <div className="flex flex-col divide-y divide-[#e4e9f0]">
                {(stats?.low_stock_alerts ?? []).length === 0 ? (
                  <p className="text-center py-4 text-sm text-[#9aa5bf]">✅ All products well stocked</p>
                ) : (stats?.low_stock_alerts ?? []).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2.5">
                    <div>
                      <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
                      <div className="text-[11px] text-[#9aa5bf]">SKU: {p.sku} · Min: {p.threshold}</div>
                    </div>
                    <div className="font-bold text-sm text-[#dc2626]">{p.stock} Left</div>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/products')}
                className="w-full mt-4 py-2.5 bg-[#1a2e4a] hover:bg-[#162540] text-white rounded-lg text-sm font-medium transition-colors">
                View All Alerts
              </button>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="font-semibold text-base text-[#1a2e4a]">Recent Transactions</div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">≡ Filter</Button>
                <Button variant="secondary" size="sm">↓ Export</Button>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e4e9f0]">
                  {['ORDER ID','CLIENT','DATE','AMOUNT','STATUS'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-sm text-[#9aa5bf]">Aucune vente enregistrée</td></tr>
                ) : sales.map((s) => (
                  <tr key={s.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-3 text-[#1e4db7] font-medium text-sm font-mono">
                      #ORD-{String(s.id).padStart(5,'0')}
                    </td>
                    <td className="py-3.5 px-3 text-sm">{s.client?.name ?? '—'}</td>
                    <td className="py-3.5 px-3 text-sm text-[#6b7a99]">
                      {new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td className="py-3.5 px-3 text-sm font-semibold">{fmt(s.total_amount)}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => navigate('/sales')}
              className="mt-4 text-[#1e4db7] text-sm font-medium hover:underline flex items-center gap-1">
              View Complete Transaction History →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
