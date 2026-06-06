// src/pages/admin/WarehousesPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'
import { Modal } from '../../components/UI/Modal'

interface Warehouse {
  id: number
  name: string
  code: string
  location: string
  manager: string
  phone: string
  email: string
  is_active: boolean
  stock_count: number
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [form, setForm] = useState({
    name: '', code: '', location: '', manager: '', phone: '', email: ''
  })

  const loadWarehouses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/warehouses')
      setWarehouses(res.data.data || [])
    } catch (error) {
      console.error('Error loading warehouses:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // ✅ CORRIGÉ : Appel asynchrone correct dans useEffect
  useEffect(() => {
    const fetchData = async () => {
      await loadWarehouses()
    }
    fetchData()
  }, [loadWarehouses])

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/warehouses/${editing.id}`, form)
      } else {
        await api.post('/warehouses', form)
      }
      setShowModal(false)
      await loadWarehouses()
      alert(editing ? 'Dépôt modifié ✅' : 'Dépôt créé ✅')
    } catch (error) {
      const apiError = error as ApiError
      alert(apiError.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Supprimer le dépôt "${warehouse.name}" ?`)) return
    try {
      await api.delete(`/warehouses/${warehouse.id}`)
      await loadWarehouses()
      alert('Dépôt supprimé ✅')
    } catch (error) {
      const apiError = error as ApiError
      alert(apiError.response?.data?.message || 'Erreur')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Warehouses Management</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Manage multi-warehouse inventory</p>
        </div>
        <Button 
          icon="🏭" 
          onClick={() => { 
            setEditing(null)
            setForm({ name: '', code: '', location: '', manager: '', phone: '', email: '' })
            setShowModal(true)
          }}
        >
          Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-[#9aa5bf]">No warehouses found</div>
        ) : (
          warehouses.map((w) => (
            <div key={w.id} className="bg-white border border-[#e4e9f0] rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg text-[#1a2e4a]">{w.name}</div>
                  <div className="text-sm text-[#1e4db7] font-mono">{w.code}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { 
                      setEditing(w)
                      setForm({ 
                        name: w.name, 
                        code: w.code, 
                        location: w.location || '', 
                        manager: w.manager || '', 
                        phone: w.phone || '', 
                        email: w.email || '' 
                      })
                      setShowModal(true) 
                    }} 
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(w)} 
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-[#6b7a99]">
                {w.location && <div>📍 {w.location}</div>}
                {w.manager && <div>👔 {w.manager}</div>}
                {w.phone && <div>📞 {w.phone}</div>}
                {w.email && <div>✉️ {w.email}</div>}
                <div className="pt-2 border-t mt-2">
                  <span className="font-semibold text-[#1a2e4a]">{w.stock_count}</span> products
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal 
        title={editing ? 'Edit Warehouse' : 'Add Warehouse'} 
        open={showModal} 
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Name *</label>
            <input 
              type="text" 
              placeholder="Warehouse name" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg focus:outline-none focus:border-[#1e4db7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Code * (unique)</label>
            <input 
              type="text" 
              placeholder="e.g., WH-001" 
              value={form.code} 
              onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg focus:outline-none focus:border-[#1e4db7]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Location</label>
            <input 
              type="text" 
              placeholder="Address or city" 
              value={form.location} 
              onChange={e => setForm({...form, location: e.target.value})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Manager</label>
            <input 
              type="text" 
              placeholder="Responsible person" 
              value={form.manager} 
              onChange={e => setForm({...form, manager: e.target.value})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Phone</label>
            <input 
              type="tel" 
              placeholder="Phone number" 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1a2e4a] mb-1">Email</label>
            <input 
              type="email" 
              placeholder="Email address" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              className="w-full p-2 border border-[#e4e9f0] rounded-lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}