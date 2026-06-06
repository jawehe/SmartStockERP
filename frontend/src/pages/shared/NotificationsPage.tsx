// src/pages/shared/NotificationsPage.tsx
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Button } from '../../components/UI/Button'

interface Notification {
  id: number
  message: string
  type: string
  is_read: boolean
  link: string | null
  time_ago: string
  created_at: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications?limit=50')
      setNotifications(res.data.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

 useEffect(() => {
  const loadNotifications = async () => {
    await fetchNotifications()
  }
  loadNotifications()
}, [])

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'danger': return '🔴'
      default: return 'ℹ️'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2e4a]">Notifications</h1>
          <p className="text-sm text-[#6b7a99] mt-0.5">
            {unreadCount} notification{unreadCount !== 1 ? 's' : ''} non lue{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="bg-white border border-[#e4e9f0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#1e4db7] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔔</div>
            <div className="text-lg font-medium text-[#1a2e4a]">Aucune notification</div>
            <div className="text-sm text-[#6b7a99] mt-1">Vous êtes à jour !</div>
          </div>
        ) : (
          <div className="divide-y divide-[#e4e9f0]">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
              >
                <div className="flex gap-3">
                  <div className="text-2xl">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-[#1a2e4a]' : 'text-gray-600'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{notif.time_ago}</p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs text-[#1e4db7] hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}