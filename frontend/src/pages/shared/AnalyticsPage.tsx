// src/pages/shared/AnalyticsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import type { DashboardStats, RevenuePoint, TopProduct } from '../../types/index'
import { Button } from '../../components/UI/Button'
import { Badge } from '../../components/UI/Badge'

type Period = '7d' | '30d' | '90d' | '1y'

export default function AnalyticsPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [topProd, setTopProd] = useState<TopProduct[]>([])
  const [period, setPeriod]   = useState<Period>('30d')
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

  useEffect(() => { load().catch(console.error) }, [load])

  const fmt    = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)
  const maxTop = Math.max(...topProd.map((p) => p.total_revenue), 1)

  // Category distribution
  const catMap: Record<string, number> = {}
  topProd.forEach((p) => { catMap[p.category ?? 'Autres'] = (catMap[p.category ?? 'Autres'] ?? 0) + p.total_revenue })
  const catTotal   = Object.values(catMap).reduce((a, b) => a + b, 1)
  const catColors  = ['#1e4db7', '#d97706', '#374151', '#9ca3af']
  const catEntries = Object.entries(catMap).slice(0, 4)

  const PERIODS: Period[] = ['7d', '30d', '90d', '1y']

  // Heatmap mock data (7 rows × 7 cols)
  const heatmap = Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, () => Math.random())
  )
  const days = ['MON','TUE','WED','THU','FRI','SAT','SUN']

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Strategic Analytics</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Real-time enterprise performance metrics and revenue tracking.</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="↓">Export PDF</Button>
          <div className="flex items-center gap-1.5">
            {PERIODS.map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
                  ${period === p ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'bg-white text-[#6b7a99] border-[#e4e9f0] hover:bg-gray-50'}`}>
                {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : p === '90d' ? 'Last 3M' : 'Last Year'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label:'REVENUE',     value: fmt(stats?.sales.revenue ?? 0),    sub:`↑ ${stats?.sales.growth_pct ?? 0}% vs last month`, color:'text-green-600', border:'border-l-[#1e4db7]' },
              { label:'AVG ORDER',   value: fmt(stats?.sales.avg_basket ?? 0), sub:`↘ 3.1% vs last month`,                             color:'text-red-500',   border:'border-l-amber-400' },
              { label:'CONVERSION',  value: '3.82%',                           sub:'↑ 0.4% increase',                                  color:'text-green-600', border:'border-l-green-500' },
              { label:'NEW CLIENTS', value: stats?.clients_count ?? 0,         sub:'↑ 12 new this week',                               color:'text-green-600', border:'border-l-purple-500' },
            ].map((k) => (
              <div key={k.label} className={`bg-white border border-[#e4e9f0] rounded-xl p-5 border-l-4 ${k.border}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-lg">📊</div>
                  <div className="text-[11px] font-semibold text-[#6b7a99] tracking-wide">{k.label}</div>
                </div>
                <div className="text-2xl font-bold text-[#1e4db7] mb-1">{k.value}</div>
                <div className={`text-xs font-medium ${k.color}`}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-[1fr_280px] gap-4 mb-4">
            {/* Revenue bar chart */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-semibold text-sm text-[#1a2e4a]">Revenue Growth</div>
                  <div className="text-xs text-[#6b7a99]">Fiscal performance trend across 2024</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#6b7a99]">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#1e4db7] inline-block" />Net Revenue</div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#bfcfef] inline-block" />Projections</div>
                </div>
              </div>
              {revenue.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm text-[#9aa5bf]">Aucune donnée</div>
              ) : (
                <>
                  <div className="flex items-end gap-1.5 h-48">
                    {revenue.map((r, i) => {
                      const h = Math.max((r.revenue / maxRev) * 180, 6)
                      const projH = h * (0.7 + Math.random() * 0.4)
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0">
                          {/* Projection overlay */}
                          <div className="w-full relative" style={{ height: `${Math.max(projH, h)}px` }}>
                            <div className="absolute bottom-0 w-full rounded-t bg-[#bfcfef]"
                              style={{ height: `${Math.max(projH, h)}px` }} />
                            <div className="absolute bottom-0 w-full rounded-t bg-[#1e4db7]"
                              style={{ height: `${h}px` }}
                              title={`${r.date}: ${fmt(r.revenue)}`} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-2 px-1">
                    {['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG'].slice(0, Math.min(revenue.length, 8)).map((m) => (
                      <span key={m} className="text-[10px] text-[#9aa5bf]">{m}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Peak activity heatmap */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-1">Peak Activity</div>
              <div className="text-xs text-[#6b7a99] mb-4">Sales intensity by day and hour</div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {days.map((d) => (
                  <div key={d} className="text-center text-[9px] text-[#9aa5bf] font-medium">{d}</div>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                {heatmap.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7 gap-1">
                    {row.map((val, ci) => (
                      <div key={ci} className="aspect-square rounded-sm"
                        style={{ background: `rgba(30,77,183,${val * 0.8 + 0.1})` }} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-[#9aa5bf]">Low Activity</span>
                <div className="flex gap-0.5">
                  {[0.15, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
                    <div key={i} className="w-4 h-2 rounded-sm" style={{ background: `rgba(30,77,183,${v})` }} />
                  ))}
                </div>
                <span className="text-[10px] text-[#9aa5bf]">Peak</span>
              </div>
            </div>
          </div>

          {/* Performance Leaders */}
          <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <div className="font-semibold text-sm text-[#1a2e4a]">Performance Leaders</div>
              <button className="text-sm text-[#1e4db7] font-medium hover:underline">View full report →</button>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e4e9f0]">
                  {['PRODUCT NAME','UNITS SOLD','REVENUE IMPACT','STOCK STATUS','PERFORMANCE SCORE'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProd.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-sm text-[#9aa5bf]">Aucune donnée</td></tr>
                ) : topProd.map((p, i) => {
                  const score = Math.round(95 - i * 7)
                  return (
                    <tr key={p.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-[#f0f4ff] rounded-lg flex items-center justify-center text-base shrink-0">📦</div>
                          <div>
                            <div className="font-medium text-sm text-[#1a2e4a]">{p.name}</div>
                            <div className="text-[11px] text-[#9aa5bf]">SKU: {p.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-sm font-medium">
                        {p.total_qty.toLocaleString()}
                      </td>
                      <td className="py-4 px-3 text-sm font-semibold">{fmt(p.total_revenue)}</td>
                      <td className="py-4 px-3">
                        <Badge variant={i === 1 ? 'warning' : 'success'}>
                          {i === 1 ? 'Low Stock' : 'Stable'}
                        </Badge>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#e4e9f0] rounded-full overflow-hidden">
                            <div className="h-full bg-[#1e4db7] rounded-full" style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-[#1a2e4a] w-8 text-right">{score}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Category donut */}
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-1">Sales by Category</div>
              <div className="text-xs text-[#6b7a99] mb-4">Revenue distribution across departments</div>
              <div className="flex items-center gap-6">
                <svg width={130} height={130} viewBox="0 0 130 130">
                  {(() => {
                    let offset = 0
                    const r = 45, cx = 65, cy = 65, circ = 2 * Math.PI * r
                    return catEntries.map(([cat, val], i) => {
                      const pct  = val / catTotal
                      const dash = pct * circ
                      const el = (
                        <circle key={cat} cx={cx} cy={cy} r={r}
                          fill="none" stroke={catColors[i] ?? '#e4e9f0'} strokeWidth={20}
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset * circ}
                          transform={`rotate(-90 ${cx} ${cy})`} />
                      )
                      offset += pct
                      return el
                    })
                  })()}
                  <text x={65} y={60} textAnchor="middle" fontSize={10} fill="#6b7a99">TOTAL</text>
                  <text x={65} y={76} textAnchor="middle" fontSize={14} fontWeight="700" fill="#1a2e4a">
                    {fmt(catTotal)}
                  </text>
                </svg>
                <div className="flex-1 space-y-3">
                  {catEntries.map(([cat, val], i) => (
                    <div key={cat} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: catColors[i] }} />
                      <span className="text-sm flex-1 text-[#1a2e4a]">{cat}</span>
                      <span className="text-sm font-semibold">{Math.round((val / catTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Forecast */}
            <div className="bg-[#1a2e4a] rounded-xl p-6 flex flex-col justify-between text-white">
              <div>
                <div className="font-bold text-base mb-2">Analytics Deep-Dive</div>
                <div className="text-white/60 text-sm mb-4 leading-relaxed">
                  Detailed performance metrics for the current financial period. AI-powered insights available.
                </div>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { label:'NET PROFIT',      value: fmt((stats?.sales.revenue ?? 0) * 0.25), sub:'+8.1% vs last period' },
                    { label:'INVENTORY',       value: `${stats?.inventory.total_products ?? 0} SKUs`, sub:'Static' },
                  ].map((k) => (
                    <div key={k.label} className="bg-white/10 rounded-lg p-3">
                      <div className="text-[10px] text-white/50 tracking-wide mb-1">{k.label}</div>
                      <div className="font-bold text-sm">{k.value}</div>
                      <div className="text-[10px] text-green-400">{k.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="w-full justify-center bg-white/10 border-white/20 text-white hover:bg-white/15"
                variant="secondary">
                Generate Detailed Forecast ✨
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
