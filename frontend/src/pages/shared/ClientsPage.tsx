// src/pages/shared/ClientsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import api from '../../services/api'
import type { Client, ClientForm } from '../../types/index'
import { usePermissions } from '../../hooks/usePermissions'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Pagination } from '../../components/UI/Table'

const inputCls = "w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors"

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  const colors   = ['#1e4db7','#0891b2','#7c3aed','#16a34a','#d97706','#dc2626']
  const color    = colors[(name.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0">
      {initials}
    </div>
  )
}

interface ClientStats {
  sale_count:  number; total_spent: number; avg_basket: number
  top_product: { name: string; quantity: number } | null
}

export default function ClientsPage() {
  const { isAdmin, isManager } = usePermissions()
  const canDelete = isAdmin
  const canEdit   = isAdmin || isManager

  const [clients, setClients]         = useState<Client[]>([])
  const [meta, setMeta]               = useState<{ total: number; total_pages: number; has_next: boolean }>({ total:0, total_pages:1, has_next:false })
  const [search, setSearch]           = useState('')
  const [page, setPage]               = useState(1)
  const [loading, setLoading]         = useState(true)
  const [selected, setSelected]       = useState<Client | null>(null)
  const [clientStats, setClientStats] = useState<ClientStats | null>(null)
  const [open, setOpen]               = useState(false)
  const [editing, setEditing]         = useState<Client | null>(null)
  const [form, setForm]               = useState<ClientForm>({ name:'', email:'', phone:'', address:'' })
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' })
      if (search) params.set('search', search)
      const res = await api.get<{ data: Client[]; meta: typeof meta }>(`/clients?${params.toString()}`)
      setClients(res.data.data ?? [])
      setMeta(res.data.meta ?? { total:0, total_pages:1, has_next:false })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { load().catch(console.error) }, [load])

  const selectClient = async (c: Client) => {
    setSelected(c)
    try {
      const r = await api.get<{ data: ClientStats }>(`/clients/${c.id}/stats`)
      setClientStats(r.data.data)
    } catch { setClientStats(null) }
  }

  const setF = (k: keyof ClientForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const openAdd = () => {
    setEditing(null); setForm({ name:'', email:'', phone:'', address:'' })
    setError(''); setOpen(true)
  }
  const openEdit = (c: Client) => {
    setEditing(c); setForm({ name:c.name, email:c.email??'', phone:c.phone??'', address:c.address??'' })
    setError(''); setOpen(true)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form)
      else         await api.post('/clients', form)
      setOpen(false); load().catch(console.error)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur')
    } finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    try { await api.delete(`/clients/${id}`); setSelected(null); load().catch(console.error) }
    catch (e: unknown) { alert((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur') }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const totalOrders   = clients.reduce((s, c) => s + (c.sale_count ?? 0), 0)
  const avgOrderValue = clients.length ? clients.reduce((s,c) => s+(c.total_spent??0), 0) / Math.max(totalOrders,1) : 0

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      {/* Left */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e4a]">Client Directory</h1>
            <p className="text-sm text-[#6b7a99] mt-0.5">Manage relationships and track customer lifecycle value.</p>
          </div>
          <div className="flex gap-2.5">
            <Button variant="secondary" icon="↓">Export CSV</Button>
            <Button icon="👤" onClick={openAdd}>New Client</Button>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label:'TOTAL CLIENTS',    value: meta.total, icon:'👥' },
            { label:'ACTIVE THIS MONTH',value: Math.floor(meta.total * 0.65), icon:'⚡' },
            { label:'AVG. ORDER VALUE', value: fmt(avgOrderValue), icon:'💰' },
            { label:'RETENTION RATE',   value: '94.2%', icon:'📈' },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-[#9aa5bf]">{k.icon}</span>
                <div className="text-[10px] font-semibold text-[#6b7a99] tracking-wide">{k.label}</div>
              </div>
              <div className="text-xl font-bold text-[#1a2e4a]">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white border border-[#e4e9f0] rounded-xl flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e4e9f0] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-[#1a2e4a]">ALL CLIENTS</span>
              {['Compact','Relaxed'].map((d) => (
                <button key={d} className="px-2.5 py-1 rounded-md text-xs border border-[#e4e9f0] hover:bg-gray-50 transition-colors">{d}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-9 w-72 focus-within:border-[#1e4db7] transition-colors">
              <span className="text-[#9aa5bf] text-sm">🔍</span>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search clients, orders, or emails..."
                className="flex-1 border-none outline-none text-sm" />
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
                  {['NAME','EMAIL','TOTAL ORDERS','LAST ACTIVE',''].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-sm text-[#9aa5bf]">Aucun client trouvé</td></tr>
                ) : clients.map((c) => (
                  <tr key={c.id} onClick={() => void selectClient(c)}
                    className={`border-b border-[#e4e9f0] last:border-0 cursor-pointer transition-colors border-l-2
                      ${selected?.id === c.id ? 'bg-[#f0f4ff] border-l-[#1e4db7]' : 'hover:bg-gray-50/60 border-l-transparent'}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.name} />
                        <span className="font-semibold text-sm text-[#1a2e4a]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6b7a99]">{c.email ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-sm">{c.sale_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6b7a99]">
                      {new Date(c.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td className="px-4 py-3.5">
                      {canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); openEdit(c) }}
                          className="text-[#9aa5bf] hover:text-[#1e4db7] transition-colors text-sm mr-2">✏</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.total > 0 && (
            <Pagination page={page} totalPages={meta.total_pages} total={meta.total} perPage={10} onChange={setPage} />
          )}
          <div className="px-4 py-2 border-t border-[#e4e9f0] text-xs text-[#6b7a99]">
            Showing 1-{Math.min(page*10, meta.total)} of {meta.total} clients
          </div>
        </div>
      </div>

      {/* Right — Client Profile */}
      {selected && (
        <div className="w-72 bg-white border border-[#e4e9f0] rounded-2xl flex flex-col overflow-auto shrink-0">
          <div className="p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm">Client Profile</span>
              <div className="flex gap-1.5">
                {canEdit && (
                  <button onClick={() => openEdit(selected)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 transition-colors text-sm">✏</button>
                )}
                <button className="w-7 h-7 rounded-md flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 transition-colors text-sm">⋮</button>
                <button onClick={() => setSelected(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-[#9aa5bf] hover:bg-gray-100 transition-colors">×</button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Avatar name={selected.name} size={64} />
              <div className="font-bold text-base text-[#1a2e4a]">{selected.name}</div>
              <div className="text-xs text-[#6b7a99]">{selected.email ?? '—'}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#f4f6f9] rounded-xl p-3">
                <div className="text-[10px] text-[#6b7a99] mb-1">LTV</div>
                <div className="text-base font-bold text-[#1e4db7]">{fmt(clientStats?.total_spent ?? selected.total_spent)}</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="text-[10px] text-[#6b7a99] mb-1">TIER</div>
                <div className="text-base font-bold text-amber-600">
                  {(clientStats?.total_spent ?? selected.total_spent) > 10000 ? 'Gold' : 'Silver'}
                </div>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7a99] tracking-wide mb-3">
                <span>🕐</span> PURCHASE HISTORY
              </div>
              {clientStats?.top_product ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#1e4db7] mt-1.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-[#1a2e4a]">Top Product: {clientStats.top_product.name}</div>
                      <div className="text-xs text-[#9aa5bf]">{clientStats.top_product.quantity} units purchased</div>
                    </div>
                    <div className="ml-auto text-sm font-semibold">{fmt(clientStats.total_spent)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3 text-sm text-[#9aa5bf]">Aucun historique</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto p-4 border-t border-[#e4e9f0] flex flex-col gap-2">
            <button className="w-full py-2.5 bg-white border border-[#e4e9f0] rounded-lg text-sm font-medium text-[#1a2e4a] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              View Full Profile →
            </button>
            {canDelete && (
              <button onClick={() => void del(selected.id, selected.name)}
                className="w-full py-2 text-red-500 text-sm hover:bg-red-50 rounded-lg transition-colors">
                🗑 Supprimer client
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        title={editing ? 'Modifier le client' : 'Nouveau client'}
        open={open} onClose={() => setOpen(false)}
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
        <div className="space-y-4">
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Nom complet *</label>
            <input value={form.name} onChange={setF('name')} placeholder="Ahmed Ben Ali" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={setF('email')} placeholder="ahmed@example.tn" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Téléphone</label>
            <input value={form.phone} onChange={setF('phone')} placeholder="+216 XX XXX XXX" className={inputCls} /></div>
          <div><label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Adresse</label>
            <textarea value={form.address} onChange={setF('address')} rows={2}
              placeholder="Adresse complète..."
              className={`${inputCls} resize-none`} /></div>
        </div>
      </Modal>
    </div>
  )
}
