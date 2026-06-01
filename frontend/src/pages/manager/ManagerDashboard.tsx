// src/pages/manager/ManagerDashboard.tsx
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import type { DashboardStats, RevenuePoint, Sale } from '../../types/index'
import { StatusBadge } from '../../components/UI/Badge'
import { Button } from '../../components/UI/Button'

type Period = '7d' | '30d' | '90d' | '1y'

interface ActivityItem { icon: string; title: string; subtitle: string; color: string }
const MOCK_ACTIVITY: ActivityItem[] = [
  { icon:'🛒', title:'New Sale: #ORD-9902',   subtitle:'Awaiting shipment • 2 mins ago',   color:'#dcfce7' },
  { icon:'👤', title:'User Alex R. logged in', subtitle:'Dublin, IE • 15 mins ago',         color:'#e8f0fe' },
  { icon:'⚠️', title:'Low Stock: SKU-901',     subtitle:'Warehouse 2 • 1 hour ago',          color:'#fee2e2' },
  { icon:'✏️', title:'Product Updated',        subtitle:'Industrial Pump X10 • 3 hours ago', color:'#f0f4ff' },
]

export default function ManagerDashboard() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<RevenuePoint[]>([])
  const [sales,   setSales]   = useState<Sale[]>([])
  const [period,  setPeriod]  = useState<Period>('30d')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n)

const periodRef = useRef(period)
useEffect(() => {
  periodRef.current = period
}, [period]) 
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function fetchAll() {
      setLoading(true)
      try {
        const p = periodRef.current
        const [s, r, sl] = await Promise.all([
          api.get<{ data: DashboardStats }>(`/dashboard/stats?period=${p}`),
          api.get<{ data: RevenuePoint[] }>(`/dashboard/revenue?period=${p}`),
          api.get<{ data: Sale[] }>('/sales?per_page=5'),
        ])
        if (cancelled) return
        setStats(s.data.data)
        setRevenue(r.data.data ?? [])
        setSales(sl.data.data ?? [])
      } catch (e) { if (!cancelled) console.error(e) }
      finally { if (!cancelled) setLoading(false) }
    }
    void fetchAll()
    return () => { cancelled = true }
  }, [reload]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = useCallback((newPeriod: Period) => {
  setPeriod(newPeriod)
  setReload(prev => prev + 1)
}, [])
const handleRefresh = useCallback(() => {
  setReload(prev => prev + 1)
}, [])


  const maxRev = Math.max(...revenue.map((r) => r.revenue), 1)

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Operations Overview</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Real-time performance metrics for SmartStock ERP Suite</p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon="↓">Export Report</Button>
          <Button icon="↺" onClick={handleRefresh}>Refresh Data</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label:'TOTAL PRODUCTS', value:stats?.inventory.total_products??0, sub:'+2.4%', urgent:false },
              { label:'TOTAL SALES',    value:fmt(stats?.sales.revenue??0),       sub:'+12.8%',urgent:false },
              { label:'TOTAL CLIENTS',  value:stats?.clients_count??0,            sub:'Static',urgent:false },
              { label:'LOW STOCK ALERTS',value:stats?.inventory.low_stock_count??0,sub:'Urgent',urgent:true },
            ].map((k) => (
              <div key={k.label} className={`bg-white rounded-xl p-5 border ${k.urgent?'border-red-200':'border-[#e4e9f0]'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${k.urgent?'bg-red-50':'bg-[#f0f4ff]'}`}>
                    {k.urgent?'⚠️':'📊'}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${k.urgent?'bg-red-50 text-red-600':'bg-green-50 text-green-700'}`}>
                    {k.sub}
                  </span>
                </div>
                <div className="text-xs text-[#6b7a99] uppercase tracking-wide mb-1">{k.label}</div>
                <div className={`text-2xl font-bold ${k.urgent?'text-red-600':'text-[#1a2e4a]'}`}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_280px] gap-4 mb-6">
            <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="font-semibold text-sm text-[#1a2e4a]">Sales Evolution</div>
                  <div className="text-xs text-[#6b7a99]">Monthly revenue trends for FY 2024</div>
                </div>
                <select onChange={(e) => handlePeriodChange(e.target.value as Period)}
                  className="px-3 py-1.5 border border-[#e4e9f0] rounded-lg text-xs bg-white outline-none">
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 6 Months</option>
                  <option value="90d">Last 3 Months</option>
                  <option value="1y">Last Year</option>
                </select>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-[#6b7a99]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e4db7] inline-block" />Revenue
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#6b7a99]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d1d5db] inline-block" />Expenses
                </div>
              </div>
              {revenue.length === 0 ? (
                <div className="h-44 flex items-center justify-center text-sm text-[#9aa5bf]">Aucune donnée</div>
              ) : (
                <>
                  <div className="flex items-end gap-0.5 h-44">
                    {revenue.map((r, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full rounded-t"
                          style={{ height:`${Math.max((r.revenue/maxRev)*160,4)}px`,
                            background:`rgba(30,77,183,${0.4+(i/revenue.length)*0.6})`, minHeight:4 }}
                          title={`${r.date}: ${fmt(r.revenue)}`} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {['JAN','FEB','MAR','APR','MAY','JUN'].map((m) => (
                      <span key={m} className="text-[10px] text-[#9aa5bf]">{m}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-[#e4e9f0] rounded-xl p-5">
              <div className="font-semibold text-sm text-[#1a2e4a] mb-4">Recent Activity</div>
              <div className="flex flex-col divide-y divide-[#e4e9f0]">
                {MOCK_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: a.color }}>{a.icon}</div>
                    <div>
                      <div className="font-medium text-sm text-[#1a2e4a]">{a.title}</div>
                      <div className="text-xs text-[#9aa5bf]">{a.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-[#1e4db7] text-sm font-medium hover:underline">View All Logs</button>
            </div>
          </div>

          <div className="bg-white border border-[#e4e9f0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="font-semibold text-sm text-[#1a2e4a]">Latest Sales Transactions</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6b7a99]">Display:</span>
                {['Compact','Relaxed'].map((d) => (
                  <button key={d} className="px-3 py-1 border border-[#e4e9f0] rounded-md text-xs hover:bg-gray-50 transition-colors">{d}</button>
                ))}
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#e4e9f0]">
                  {['ORDER ID','CLIENT','DATE','STATUS','TOTAL','ACTIONS'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-sm text-[#9aa5bf]">Aucune vente</td></tr>
                ) : sales.map((s) => (
                  <tr key={s.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-3 text-[#1e4db7] font-medium text-sm font-mono">#ORD-{String(s.id).padStart(4,'0')}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1e4db7] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {s.client?.name?.slice(0,2).toUpperCase()??'AN'}
                        </div>
                        <span className="text-sm">{s.client?.name??'—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-[#6b7a99]">
                      {new Date(s.sale_date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                    <td className="py-3 px-3 text-sm font-semibold">{fmt(s.total_amount)}</td>
                    <td className="py-3 px-3">
                      <button onClick={() => navigate('/sales')} className="text-[#9aa5bf] hover:text-[#1e4db7] transition-colors text-sm">⋮</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
