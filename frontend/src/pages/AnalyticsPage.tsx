// src/pages/AnalyticsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'
import type { DashboardStats, RevenuePoint, TopProduct } from '../types/index'

type Period = '7d' | '30d' | '90d' | '1y'

// ── KPI Card ────────────────────────────────────────────────
function KPICard({ label, value, sub, subColor, extra }: {
  label: string; value: string | number
  sub?: string; subColor?: string; extra?: string
}) {
  return (
    <div className="bg-white border border-[#e4e9f0] rounded-xl p-5"
      style={{ borderLeft: `4px solid ${subColor ?? '#1e4db7'}` }}>
      <div className="text-[11px] font-semibold text-[#6b7a99] tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold text-[#1a2e4a] mb-1">{value}</div>
      {sub   && <div className="text-xs font-medium" style={{ color: subColor ?? '#16a34a' }}>{sub}</div>}
      {extra && <div className="text-[11px] text-[#9aa5bf] mt-0.5">{extra}</div>}
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [topProd, setTopProd] = useState<TopProduct[]>([])
  const [period, setPeriod]   = useState<Period>('90d')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, r, t] = await Promise.all([
        api.get<{ data: DashboardStats }>(`/dashboard/stats?period=${period}`),
        api.get<{ data: RevenuePoint[] }>(`/dashboard/revenue?period=${period}`),
        api.get<{ data: TopProduct[] }>(`/dashboard/top-products?period=${period}&limit=5&by=revenue`),
      ])
      setStats(s.data.data)
      setRevenue(r.data.data ?? [])
      setTopProd(t.data.data ?? [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [period])

  useEffect(() => {
   const fetchData = async () => {
    try {
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  void fetchData()
}, [load])

  const fmt      = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const maxRev   = Math.max(...revenue.map((r) => r.revenue), 1)
  const maxTop   = Math.max(...topProd.map((p) => p.total_revenue), 1)
  const PERIODS: Period[] = ['7d', '30d', '90d', '1y']

  // Category distribution from top products
  const catMap: Record<string, number> = {}
  topProd.forEach((p) => { catMap[p.category ?? 'Autres'] = (catMap[p.category ?? 'Autres'] ?? 0) + p.total_revenue })
  const catTotal   = Object.values(catMap).reduce((a, b) => a + b, 1)
  const catColors  = ['#1e4db7', '#d97706', '#374151']
  const catEntries = Object.entries(catMap).slice(0, 3)

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Analytics Overview</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Performance metrics and inventory forecasting</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6b7a99]">Period:</span>
          {PERIODS.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 border rounded-md text-xs font-medium transition-colors
                ${period === p ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-[#9aa5bf]">Chargement des analytics...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard label="TOTAL REVENUE"
              value={fmt(stats?.sales.revenue ?? 0)}
              sub={stats?.sales.growth_pct ? `↑ +${stats.sales.growth_pct}%` : '—'}
              subColor="#16a34a"
              extra={`vs previous ${period}`} />
            <KPICard label="INVENTORY TURNOVER" value="8.2x"
              sub="↑ +5.1%" subColor="#16a34a" extra="Target: 7.5x" />
            <KPICard label="ACTIVE CLIENTS"
              value={stats?.clients_count ?? 0}
              sub="↑ +8.2%" subColor="#16a34a" extra="128 new this quarter" />
            <KPICard label="FULFILLMENT RATE" value="94.8%"
              sub="↘ -1.2%" subColor="#dc2626" extra="Due to supply chain delays" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Revenue Line chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-1">Monthly Revenue Trends</div>
              <div className="text-xs text-[#6b7a99] mb-4">{period} period</div>
              {revenue.length === 0 ? (
                <div className="h-36 flex items-center justify-center text-sm text-[#9aa5bf]">Aucune donnée</div>
              ) : (
                <>
                  <div className="flex items-end gap-0.5 h-36">
                    {revenue.map((r, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full rounded-t transition-all"
                          style={{
                            height: `${Math.max((r.revenue / maxRev) * 130, 3)}px`,
                            background: `rgba(30,77,183,${0.35 + (i / revenue.length) * 0.65})`,
                            minHeight: 3,
                          }}
                          title={`${r.date}: ${fmt(r.revenue)}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'].map((m) => (
                      <span key={m} className="text-[10px] text-[#9aa5bf]">{m}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Donut chart — Category */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-4">Sales by Category</div>
              <div className="flex items-center gap-6">
                {/* SVG Donut */}
                <svg width={130} height={130} viewBox="0 0 130 130">
                  {(() => {
                    let offset = 0
                    const r = 45, cx = 65, cy = 65
                    const circumference = 2 * Math.PI * r
                    return catEntries.map(([cat, val], i) => {
                      const pct  = val / catTotal
                      const dash = pct * circumference
                      const el = (
                        <circle key={cat} cx={cx} cy={cy} r={r}
                          fill="none"
                          stroke={catColors[i] ?? '#e4e9f0'}
                          strokeWidth={18}
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={-offset * circumference}
                          transform={`rotate(-90 ${cx} ${cy})`} />
                      )
                      offset += pct
                      return el
                    })
                  })()}
                  <text x={65} y={60} textAnchor="middle" fontSize={11} fill="#6b7a99">TOTAL</text>
                  <text x={65} y={76} textAnchor="middle" fontSize={14} fontWeight="600" fill="#1a2e4a">
                    {(catTotal / 1000).toFixed(1)}k
                  </text>
                </svg>

                <div className="flex-1 space-y-3">
                  {catEntries.length === 0 ? (
                    <span className="text-sm text-[#9aa5bf]">Aucune donnée</span>
                  ) : catEntries.map(([cat, val], i) => (
                    <div key={cat} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: catColors[i] }} />
                      <span className="text-sm flex-1 text-[#1a2e4a]">{cat}</span>
                      <span className="text-sm font-semibold" style={{ color: catColors[i] }}>
                        {Math.round((val / catTotal) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4 mb-4">

            {/* Top products */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-4">Top Selling Products</div>
              {topProd.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#9aa5bf]">Aucune vente sur cette période</div>
              ) : topProd.map((p, i) => (
                <div key={p.id} className="mb-4 last:mb-0">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-[#1a2e4a]">{p.name}</span>
                    <span className="text-sm font-semibold text-[#1a2e4a]">{fmt(p.total_revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-[#e4e9f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${(p.total_revenue / maxTop) * 100}%`,
                        background: (['#1e4db7', '#0891b2', '#7c3aed', '#16a34a', '#d97706'] as string[])[i] ?? '#1e4db7',
                      }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Customer retention */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-4">Customer Retention</div>
              <div className="flex justify-center mb-4">
                <svg width={140} height={90} viewBox="0 0 140 90">
                  <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e4e9f0" strokeWidth="14" />
                  <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#1e4db7" strokeWidth="14"
                    strokeDasharray={`${0.82 * 173} 173`} strokeLinecap="round" />
                  <text x={70} y={74} textAnchor="middle" fontSize={20} fontWeight="700" fill="#1a2e4a">82%</text>
                </svg>
              </div>
              <p className="text-center text-sm text-[#6b7a99] mb-4">Exceeding Annual Goal</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'NEW LEADS', value: '+18%', color: 'text-green-600' },
                  { label: 'CHURN RATE', value: '2.4%', color: 'text-red-500' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-[11px] text-[#6b7a99] mb-1">{item.label}</div>
                    <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Global growth banner */}
          <div className="bg-[#1e4db7] rounded-xl p-6 grid grid-cols-3 gap-8 items-center text-white mb-4">
            <div>
              <div className="text-xs text-white/60 mb-2">FY2024 Year-over-Year Growth</div>
              <div className="font-semibold text-sm leading-relaxed">
                Comprehensive performance analysis shows a resilient recovery in manufacturing sectors.
              </div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-white/60 tracking-wide mb-2">GLOBAL EXPANSION</div>
              <div className="text-4xl font-bold mb-2">+22%</div>
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">Top Performer: APAC</span>
            </div>
            <div className="space-y-2">
              {[
                ['Logistics Efficiency',    '+14.2%'],
                ['Operating Margin',        '+5.8%'],
                ['Employee Productivity',   '+9.1%'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm">
                  <span className="text-white/75">{l}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Forecast */}
          <div className="bg-[#1a2e4a] rounded-xl p-6 flex justify-between items-center text-white">
            <div>
              <div className="font-semibold text-base mb-1.5">Predictive AI Forecast</div>
              <div className="text-sm text-white/60 mb-4">
                Inventory levels are predicted to stabilize by mid-October.
              </div>
              <button className="px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium hover:bg-white/15 transition-colors">
                Generate Detailed Forecast
              </button>
            </div>
            <div className="text-5xl opacity-50 select-none">✨</div>
          </div>
        </>
      )}
    </div>
  )
}
