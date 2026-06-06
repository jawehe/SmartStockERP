// src/pages/admin/AuditLogsPage.tsx
import { useEffect, useState, useCallback } from 'react'
import api from '../../services/api'

interface AuditLog {
  id: number
  user_name: string
  user_role: string
  action: string
  entity: string
  entity_id: number
  details: string
  ip_address: string
  time_ago: string
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterEntity, setFilterEntity] = useState('')
  const [filterAction, setFilterAction] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '50' })
      if (filterEntity) params.set('entity', filterEntity)
      if (filterAction) params.set('action', filterAction)
      
      const res = await api.get(`/audit/logs?${params.toString()}`)
      setLogs(res.data.data || [])
      setTotalPages(res.data.meta?.total_pages || 1)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filterEntity, filterAction])

  useEffect(() => {
    const loadData = async () => {
      await fetchLogs()
    }
    loadData()
  }, [fetchLogs])

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-700',
      UPDATE: 'bg-blue-100 text-blue-700',
      DELETE: 'bg-red-100 text-red-700',
      LOGIN_SUCCESS: 'bg-green-100 text-green-700',
      LOGIN_FAILED: 'bg-red-100 text-red-700',
      LOGOUT: 'bg-gray-100 text-gray-700',
      TOKEN_REFRESH: 'bg-purple-100 text-purple-700'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-700'}`}>
        {action}
      </span>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Audit Logs</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">Track all system activities and user actions</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="px-4 py-2 border border-[#e4e9f0] rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl p-4 mb-4 flex gap-3 flex-wrap">
        <select
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#1e4db7]"
        >
          <option value="">All Entities</option>
          <option value="Product">Product</option>
          <option value="Sale">Sale</option>
          <option value="Client">Client</option>
          <option value="User">User</option>
          <option value="Supplier">Supplier</option>
          <option value="Purchase">Purchase</option>
          <option value="Auth">Authentication</option>
          <option value="Profile">Profile</option>
        </select>
        
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-[#e4e9f0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#1e4db7]"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN_SUCCESS">Login Success</option>
          <option value="LOGIN_FAILED">Login Failed</option>
          <option value="LOGOUT">Logout</option>
          <option value="TOKEN_REFRESH">Token Refresh</option>
        </select>
        
        <button
          onClick={() => { setFilterEntity(''); setFilterAction(''); setPage(1) }}
          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">TIME</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">USER</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">ACTION</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">ENTITY</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">DETAILS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-[#6b7a99]">IP ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9aa5bf]">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-[#6b7a99] whitespace-nowrap">
                      {log.time_ago}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-sm">{log.user_name}</div>
                      <div className="text-xs text-[#9aa5bf]">{log.user_role}</div>
                    </td>
                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {log.entity}{log.entity_id ? ` #${log.entity_id}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6b7a99] max-w-md truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-[#6b7a99] font-mono">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <div className="text-xs text-[#6b7a99]">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}