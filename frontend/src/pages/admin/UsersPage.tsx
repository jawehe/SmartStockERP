// src/pages/admin/UsersPage.tsx
import { useEffect, useState, useCallback } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import api from '../../services/api'
import type { User } from '../../types/index'
import type { Role } from '../../types/permissions'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Badge } from '../../components/UI/Badge'

interface UserForm { name: string; email: string; password: string; role: Role }

const ROLE_BADGE: Record<Role, 'danger' | 'warning' | 'success'> = {
  admin: 'danger', manager: 'warning', seller: 'success',
}

const inputCls = "w-full px-3 py-2.5 border border-[#e4e9f0] rounded-lg text-sm outline-none focus:border-[#1e4db7] transition-colors"

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0,2).map((n) => n[0]).join('').toUpperCase()
  const colors   = ['#1e4db7','#0891b2','#7c3aed','#16a34a','#d97706']
  const color    = colors[(name.charCodeAt(0) ?? 0) % colors.length]
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
      style={{ background: color }}>
      {initials}
    </div>
  )
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm]       = useState<UserForm>({ name:'', email:'', password:'', role:'cashier' })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Assuming admin endpoint — adapt URL if needed
      const res = await api.get<{ data: User[] }>('/users')
      setUsers(res.data.data ?? [])
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [])

useEffect(() => {
  const run = async () => {
    await load();
  };

  run();
}, []);

  const setF = (k: keyof UserForm) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const openAdd = () => {
    setEditing(null); setForm({ name:'', email:'', password:'', role:'seller' })
    setError(''); setOpen(true)
  }
  const openEdit = (u: User) => {
    setEditing(u); setForm({ name:u.name, email:u.email, password:'', role:u.role })
    setError(''); setOpen(true)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      if (editing) await api.put(`/users/${editing.id}`, { name: form.name, role: form.role })
      else         await api.post('/auth/register', form)
      setOpen(false); load().catch(console.error)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur'
      setError(msg)
    } finally { setSaving(false) }
  }

  const del = async (id: number, name: string) => {
    if (!window.confirm(`Supprimer l'utilisateur "${name}" ?`)) return
    try { await api.delete(`/users/${id}`); load().catch(console.error) }
    catch (err: unknown) {
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Erreur')
    }
  }

  const countByRole = (role: Role) => users.filter((u) => u.role === role).length

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Users Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Manage system users, roles and access permissions.</p>
        </div>
        <Button onClick={openAdd} icon="⊕">Add User</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Users',  value: users.length,          icon:'👥', color:'border-[#e4e9f0]' },
          { label:'Admins',       value: countByRole('admin'),   icon:'🔴', color:'border-red-200' },
          { label:'Managers',     value: countByRole('manager'), icon:'🟡', color:'border-amber-200' },
          { label:'Sellers',      value: countByRole('seller'),  icon:'🟢', color:'border-green-200' },
        ].map((k) => (
          <div key={k.label} className={`bg-white rounded-xl p-4 border ${k.color} flex items-center gap-3`}>
            <span className="text-2xl">{k.icon}</span>
            <div>
              <div className="text-xs text-[#6b7a99]">{k.label}</div>
              <div className="text-xl font-bold text-[#1a2e4a]">{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#f4f6f9] border-b border-[#e4e9f0]">
              {['USER','EMAIL','ROLE','CREATED','ACTIONS'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a99] tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12">
                <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" /></div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-sm text-[#9aa5bf]">Aucun utilisateur trouvé</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-[#e4e9f0] last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} />
                    <span className="font-medium text-sm text-[#1a2e4a]">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-[#6b7a99]">{u.email}</td>
                <td className="px-4 py-3.5">
                  <Badge variant={ROLE_BADGE[u.role as Role] ?? 'default'} size="md">
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3.5 text-sm text-[#6b7a99]">
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(u)}
                      className="text-sm text-[#9aa5bf] hover:text-[#1e4db7] transition-colors">✏</button>
                    <button onClick={() => void del(u.id, u.name)}
                      className="text-sm text-[#9aa5bf] hover:text-red-500 transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal
        title={editing ? 'Modifier utilisateur' : 'Ajouter un utilisateur'}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
            <Button loading={saving} onClick={(e) => void save(e as unknown as FormEvent)}>
              {editing ? 'Modifier' : 'Créer'}
            </Button>
          </>
        }
      >
        {error && <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-sm mb-4">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Nom complet *</label>
            <input value={form.name} onChange={setF('name')} placeholder="John Doe" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={setF('email')} placeholder="john@company.com"
              className={inputCls} disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Mot de passe *</label>
              <input type="password" value={form.password} onChange={setF('password')} placeholder="••••••••" className={inputCls} />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[#6b7a99] block mb-1.5">Rôle *</label>
            <select value={form.role} onChange={setF('role')} className={inputCls}>
              <option value="seller">Seller (Vendeur)</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
