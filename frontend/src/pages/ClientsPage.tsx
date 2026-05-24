// src/pages/ClientsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import api from '../services/api'
import type { Client, ClientForm } from '../types/index'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-7 w-[460px] shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold text-[#1a2e4a]">{title}</h3>
          <button onClick={onClose} className="text-xl text-[#9aa5bf] hover:text-[#1a2e4a]">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
  const colors   = ['#1e4db7', '#0891b2', '#7c3aed', '#16a34a', '#d97706', '#dc2626']
  const color    = colors[(name.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0">
      {initials}
    </div>
  )
}

interface ClientStats {
  sale_count:  number
  total_spent: number
  avg_basket:  number
  top_product: { name: string; quantity: number } | null
}

const inputCls = "w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors"

export default function ClientsPage() {
  const [clients, setClients]     = useState<Client[]>([])
  const [meta, setMeta]           = useState<{ total?: number; total_pages?: number; has_next?: boolean }>({})
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Client | null>(null)
  const [clientStats, setClientStats] = useState<ClientStats | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState<Client | null>(null)
  const [form, setForm]           = useState<ClientForm>({ name: '', email: '', phone: '', address: '' })
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '10' })
      if (search) params.set('search', search)
      const res = await api.get<{ data: Client[]; meta: typeof meta }>(`/clients?${params.toString()}`)
      setClients(res.data.data ?? [])
      setMeta(res.data.meta ?? {})
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { const fetchData = async () => {
    try {
      await load()
    } catch (err) {
      console.error(err)
    }
  }

  void fetchData()
}, [load])

  const selectClient = async (c: Client) => {
    setSelected(c)
    try {
      const r = await api.get<{ data: ClientStats }>(`/clients/${c.id}/stats`)
      setClientStats(r.data.data)
    } catch { setClientStats(null) }
  }

  const setF = (k: keyof ClientForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', email: '', phone: '', address: '' })
    setError(''); setShowModal(true)
  }

  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' })
    setError(''); setShowModal(true)
  }

  const save = async () => {
    setSaving(true); setError('')
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form)
      else         await api.post('/clients', form)
      setShowModal(false)
      load().catch(console.error)
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axErr = e as { response?: { data?: { message?: string } } }
        setError(axErr.response?.data?.message ?? 'Erreur')
      }
    } finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer "${name}" ?`)) return
    try {
      await api.delete(`/clients/${id}`)
      setSelected(null)
      load().catch(console.error)
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'response' in e) {
        const axErr = e as { response?: { data?: { message?: string } } }
        alert(axErr.response?.data?.message ?? 'Erreur')
      }
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const totalOrders   = clients.reduce((s, c) => s + (c.sale_count ?? 0), 0)
  const avgOrderValue = clients.length
    ? clients.reduce((s, c) => s + (c.total_spent ?? 0), 0) / Math.max(totalOrders, 1)
    : 0

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)]">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e4a]">Client Management</h1>
            <p className="text-sm text-[#6b7a99] mt-0.5">Manage your customer database, order history, and company profiles.</p>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-1.5 px-4 py-2 border border-[#e4e9f0] rounded-lg text-sm font-medium text-[#6b7a99] hover:bg-gray-50 transition-colors">↑ Import Clients</button>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors">👤 Add New Client</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { icon: '👥', label: 'Total Clients',      value: meta.total ?? clients.length, sub: '+12%', subColor: 'text-green-600' },
            { icon: '🛒', label: 'Active Orders',       value: totalOrders,                  sub: '',     subColor: '' },
            { icon: '📈', label: 'Average Order Value', value: fmt(avgOrderValue),           sub: '',     subColor: '' },
            { icon: '🚩', label: 'Pending Support',     value: 0,                            sub: '',     subColor: '' },
          ].map((k) => (
            <div key={k.label} className="bg-white border border-[#e4e9f0] rounded-xl px-4 py-3 flex items-center gap-2.5">
              <span className="text-xl">{k.icon}</span>
              <div>
                {k.sub && <div className={`text-xs font-semibold ${k.subColor}`}>{k.sub}</div>}
                <div className="text-[11px] text-[#6b7a99]">{k.label}</div>
                <div className="text-lg font-bold text-[#1a2e4a]">{k.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-[#e4e9f0] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-sm text-[#1a2e4a]">Client Directory</span>
              <div className="flex gap-1.5">
                {['Relaxed', 'Compact'].map((d) => (
                  <button key={d} className={`px-3 py-1 rounded-full text-xs font-medium border ${d === 'Relaxed' ? 'bg-[#e8f0fe] text-[#1e4db7] border-[#e8f0fe]' : 'bg-white text-[#9aa5bf] border-[#e4e9f0]'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 border border-[#e4e9f0] rounded-lg px-3 h-9 w-72">
              <span className="text-[#9aa5bf] text-sm">🔍</span>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search clients, companies or emails..."
                className="flex-1 border-none outline-none text-sm" />
            </div>
          </div>

          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
                  {['CLIENT NAME', 'CONTACT EMAIL', 'TOTAL ORDERS', 'LAST ACTIVE', 'ACTIONS'].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10 text-[#9aa5bf]">Chargement...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-sm text-[#9aa5bf]">Aucun client trouvé</td></tr>
                ) : clients.map((c) => (
                  <tr key={c.id} onClick={() => void selectClient(c)}
                    className={`border-b border-[#e4e9f0] last:border-0 cursor-pointer transition-colors ${selected?.id === c.id ? 'bg-[#f0f4ff]' : 'hover:bg-gray-50/60'}`}>
                    <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={c.name} /><span className="font-medium text-sm">{c.name}</span></div></td>
                    <td className="px-4 py-3 text-sm text-[#6b7a99]">{c.email ?? '—'}</td>
                    <td className="px-4 py-3"><span className="bg-[#e8f0fe] text-[#1e4db7] px-2.5 py-0.5 rounded-full text-xs font-semibold">{c.sale_count ?? 0}</span></td>
                    <td className="px-4 py-3 text-sm text-[#6b7a99]">{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><button onClick={(e) => { e.stopPropagation(); void selectClient(c) }} className="text-[#1e4db7] text-sm font-medium hover:underline">Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(meta.total ?? 0) > 0 && (
            <div className="flex justify-between items-center px-4 py-2.5 border-t border-[#e4e9f0]">
              <span className="text-xs text-[#6b7a99]">{((page - 1) * 10) + 1}–{Math.min(page * 10, meta.total ?? 0)} / <strong>{meta.total}</strong></span>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">‹</button>
                {[1, 2, 3].filter((n) => n <= (meta.total_pages ?? 1)).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`px-2.5 py-1 border rounded-md text-sm ${page === n ? 'bg-[#1e4db7] text-white border-[#1e4db7]' : 'border-[#e4e9f0] hover:bg-gray-50'}`}>{n}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(meta.total_pages ?? 1, p + 1))} disabled={!meta.has_next} className="px-2.5 py-1 border border-[#e4e9f0] rounded-md text-sm disabled:opacity-40">›</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="w-72 bg-white border border-[#e4e9f0] rounded-2xl p-5 flex flex-col gap-4 overflow-auto shrink-0">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm">Client Profile</span>
            <button onClick={() => setSelected(null)} className="text-lg text-[#9aa5bf] hover:text-[#1a2e4a]">×</button>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2.5"><Avatar name={selected.name} size={64} /></div>
            <div className="font-bold text-base text-[#1a2e4a]">{selected.name}</div>
            <div className="text-xs text-[#6b7a99]">Client</div>
          </div>
          <div className="bg-[#f4f6f9] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-[#6b7a99] tracking-wide mb-2.5">CONTACT DETAILS</div>
            <div className="flex justify-between text-sm mb-1.5"><span className="text-[#6b7a99]">Email</span><span className="font-medium text-[#1a2e4a] truncate ml-2">{selected.email ?? '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#6b7a99]">Phone</span><span className="font-medium text-[#1a2e4a]">{selected.phone ?? '—'}</span></div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-[#6b7a99] tracking-wide mb-2.5">FINANCIAL SNAPSHOT</div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#f4f6f9] rounded-xl p-3"><div className="text-[11px] text-[#6b7a99] mb-1">TOTAL SPENT</div><div className="text-base font-bold text-[#1e4db7]">{fmt(clientStats?.total_spent ?? selected.total_spent)}</div></div>
              <div className="bg-[#f4f6f9] rounded-xl p-3"><div className="text-[11px] text-[#6b7a99] mb-1">TOTAL ORDERS</div><div className="text-base font-bold text-[#1a2e4a]">{clientStats?.sale_count ?? selected.sale_count}</div></div>
            </div>
          </div>
          {clientStats?.top_product && (
            <div className="bg-[#f0f4ff] rounded-xl p-3">
              <div className="text-[11px] text-[#6b7a99] mb-1">TOP PRODUCT</div>
              <div className="text-sm font-medium text-[#1a2e4a]">{clientStats.top_product.name}</div>
              <div className="text-xs text-[#6b7a99]">{clientStats.top_product.quantity} unités achetées</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button onClick={() => openEdit(selected)} className="py-2.5 bg-[#1e4db7] text-white rounded-lg text-sm font-medium hover:bg-[#1a3fa0] transition-colors">Edit Client</button>
            <button onClick={() => void del(selected.id, selected.name)} className="py-2.5 bg-white text-red-500 border border-red-400 rounded-lg text-sm hover:bg-red-50 transition-colors">🗑</button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Modifier le client' : 'Ajouter un client'} onClose={() => setShowModal(false)}>
          {error && <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-sm mb-4">{error}</div>}
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-[#6b7a99] block mb-1">Nom complet *</label><input value={form.name} onChange={setF('name')} placeholder="Ahmed Ben Ali" className={inputCls} /></div>
            <div><label className="text-xs font-medium text-[#6b7a99] block mb-1">Email</label><input type="email" value={form.email} onChange={setF('email')} placeholder="ahmed@example.tn" className={inputCls} /></div>
            <div><label className="text-xs font-medium text-[#6b7a99] block mb-1">Téléphone</label><input value={form.phone} onChange={setF('phone')} placeholder="+216 XX XXX XXX" className={inputCls} /></div>
            <div><label className="text-xs font-medium text-[#6b7a99] block mb-1">Adresse</label><textarea value={form.address} onChange={setF('address')} rows={2} placeholder="Adresse complète..." className={`${inputCls} resize-none`} /></div>
          </div>
          <div className="flex gap-2.5 justify-end mt-5">
            <button onClick={() => setShowModal(false)} className="px-5 py-2.5 border border-[#e4e9f0] rounded-lg text-sm hover:bg-gray-50 transition-colors">Annuler</button>
            <button onClick={() => void save()} disabled={saving} className="px-5 py-2.5 bg-[#1e4db7] hover:bg-[#1a3fa0] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60">{saving ? 'Sauvegarde...' : editing ? 'Modifier' : 'Créer'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
