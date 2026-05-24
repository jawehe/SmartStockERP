// src/pages/DashboardPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { DashboardStats, RevenuePoint, Sale } from '../types/index'

type Period = '7d' | '30d' | '90d' | '1y'

// ── Composants locaux ───────────────────────────────────────
function KPICard({ label, value, sub, subColor, icon }: {
  label: string; value: string | number
  sub?: string; subColor?: string; icon: string
}) {
  return (
    <div className="bg-white border border-[#e4e9f0] rounded-2xl p-5 flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-[#f0f4ff] flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        {sub && (
          <div className="text-xs font-semibold mb-1" style={{ color: subColor ?? '#16a34a' }}>{sub}</div>
        )}
        <div className="text-xs text-[#6b7a99] mb-1">{label}</div>
        <div className="text-xl font-bold text-[#1a2e4a] truncate">{value}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: '#dcfce7', color: '#16a34a' },
    processing: { bg: '#dbeafe', color: '#1e40af' },
    pending:   { bg: '#fef3c7', color: '#d97706' },
    cancelled: { bg: '#fee2e2', color: '#dc2626' },
  }
  const s = map[status] ?? map['pending']
  return (
    <span className="px-3 py-0.5 rounded-full text-xs font-medium capitalize"
      style={{ background: s.bg, color: s.color }}>
      {status}
    </span>
  )
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [sales, setSales]     = useState<Sale[]>([])
  const [period, setPeriod]   = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const navigate              = useNavigate()

  useEffect(() => {
    const load = async () => {
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
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    void load()
  }, [period])

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)

  const PERIODS: Period[] = ['7d', '30d', '90d', '1y']

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a2e4a]">Executive Dashboard</h1>
        <p className="text-[#6b7a99] text-sm mt-0.5">Real-time overview of SmartStock Enterprise performance.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#6b7a99]">Chargement...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard icon="💰" label="Total Revenue"
              value={fmt(stats?.sales.revenue ?? 0)}
              sub={stats?.sales.growth_pct ? `+${stats.sales.growth_pct}% ↑` : 'Current'}
              subColor="#16a34a" />
            <KPICard icon="📦" label="Total Products"
              value={stats?.inventory.total_products ?? 0}
              sub="Current" subColor="#6b7a99" />
            <KPICard icon="🧾" label="Sales Count"
              value={stats?.sales.count ?? 0}
              sub="This period" subColor="#d97706" />
            <KPICard icon="👥" label="Total Clients"
              value={stats?.clients_count ?? 0}
              sub="+8 ↑" subColor="#16a34a" />
          </div>

          {/* Chart + Alerts */}
          <div className="grid grid-cols-[1fr_300px] gap-4 mb-6">

            {/* Revenue bar chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <div className="font-semibold text-base text-[#1a2e4a]">Revenue Growth</div>
                  <div className="text-xs text-[#6b7a99]">Monthly performance tracking</div>
                </div>
                <div className="flex gap-1.5">
                  {PERIODS.map((p) => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border
                        ${period === p
                          ? 'bg-[#1e4db7] text-white border-[#1e4db7]'
                          : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              {revenue.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-[#9aa5bf] text-sm">
                  Aucune donnée pour cette période
                </div>
              ) : (
                <div className="flex items-end gap-1 h-40">
                  {revenue.map((r, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${Math.max((r.revenue / maxRev) * 140, 4)}px`,
                          background: `rgba(30,77,183,${0.4 + (i / revenue.length) * 0.6})`,
                          minHeight: 4,
                        }}
                        title={`${r.date}: ${fmt(r.revenue)}`}
                      />
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
                {stats?.inventory.low_stock_count ?? 0} items requiring replenishment
              </div>
              {(stats?.low_stock_alerts ?? []).length === 0 ? (
                <div className="text-center py-5 text-sm text-[#9aa5bf]">✅ All products well stocked</div>
              ) : (
                (stats?.low_stock_alerts ?? []).map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#e4e9f0] last:border-0">
                    <div>
                      <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
                      <div className="text-[11px] text-[#9aa5bf]">SKU: {p.sku} · Min: {p.threshold}</div>
                    </div>
                    <div className="font-bold text-sm text-[#dc2626]">{p.stock} Left</div>
                  </div>
                ))
              )}
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
                {['≡ Filter', '↓ Export'].map((btn) => (
                  <button key={btn}
                    className="px-3 py-1.5 border border-[#e4e9f0] rounded-lg text-xs text-[#6b7a99] hover:bg-gray-50 transition-colors">
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e4e9f0]">
                  {['ORDER ID', 'CLIENT', 'DATE', 'AMOUNT', 'STATUS'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm text-[#9aa5bf]">
                      Aucune vente enregistrée
                    </td>
                  </tr>
                ) : sales.map((s) => (
                  <tr key={s.id} className="border-b border-[#e4e9f0] last:border-0">
                    <td className="py-3 px-3 text-[#1e4db7] font-medium text-sm font-mono">
                      #ORD-{String(s.id).padStart(5, '0')}
                    </td>
                    <td className="py-3 px-3 text-sm">{s.client?.name ?? '—'}</td>
                    <td className="py-3 px-3 text-sm text-[#6b7a99]">
                      {new Date(s.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3 text-sm font-semibold">{fmt(s.total_amount)}</td>
                    <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
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
