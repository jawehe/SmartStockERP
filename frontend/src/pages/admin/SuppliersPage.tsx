// src/pages/admin/SuppliersPage.tsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'
import { Modal } from '../../components/UI/Modal'

interface Supplier {
  id: number
  name: string
  email: string
  phone: string
  address: string
  purchase_count: number
  created_at: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })

  const loadSuppliers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/suppliers')
      setSuppliers(res.data.data || [])
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

 useEffect(() => {
  const fetchData = async () => {
    await loadSuppliers()
  }
  fetchData()
}, [])

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/suppliers/${editing.id}`, form)
      } else {
        await api.post('/suppliers', form)
      }
      setShowModal(false)
      loadSuppliers()
    } catch (error) {
      console.error('Error saving supplier:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce fournisseur ?')) return
    try {
      await api.delete(`/suppliers/${id}`)
      loadSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Suppliers Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Manage your suppliers and vendors</p>
        </div>
        <Button icon="+" onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '', address: '' }); setShowModal(true) }}>
          Add Supplier
        </Button>
      </div>

      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-[#6b7a99]">NAME</th>
              <th className="text-left p-3 text-xs font-semibold text-[#6b7a99]">EMAIL</th>
              <th className="text-left p-3 text-xs font-semibold text-[#6b7a99]">PHONE</th>
              <th className="text-left p-3 text-xs font-semibold text-[#6b7a99]">PURCHASES</th>
              <th className="text-left p-3 text-xs font-semibold text-[#6b7a99]">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-[#9aa5bf]">No suppliers found</td></tr>
            ) : (
              suppliers.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-sm text-[#6b7a99]">{s.email || '—'}</td>
                  <td className="p-3 text-sm text-[#6b7a99]">{s.phone || '—'}</td>
                  <td className="p-3 text-sm">{s.purchase_count}</td>
                  <td className="p-3">
                    <button onClick={() => { setEditing(s); setForm(s); setShowModal(true) }} className="text-blue-500 mr-2">✏️</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal title={editing ? 'Edit Supplier' : 'Add Supplier'} open={showModal} onClose={() => setShowModal(false)}>
        <div className="space-y-4">
          <input type="text" placeholder="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded" />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded" />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded" />
          <textarea placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full p-2 border rounded" rows={2} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}