// src/components/UI/NotificationBell.tsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

interface Notification {
  id: number
  message: string
  type: string
  is_read: boolean
  link: string | null
  time_ago: string
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchNotifications = async (): Promise<void> => {
    try {
      const res = await api.get('/notifications?limit=10')
      setNotifications(res.data.data || [])
      setUnreadCount(res.data.unread_count || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

useEffect(() => {
  const loadNotifications = async () => {
    await fetchNotifications()
  }
  loadNotifications()
  const interval = setInterval(fetchNotifications, 30000)
  return () => clearInterval(interval)
}, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: number): Promise<void> => {
    try {
      await api.patch(`/notifications/${id}/read`)
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    try {
      await api.patch('/notifications/read-all')
      await fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notif: Notification): Promise<void> => {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    if (notif.link) {
      navigate(notif.link)
      setIsOpen(false)
    }
  }

  const getIcon = (type: string): string => {
    switch(type) {
      case 'warning': return '⚠️'
      case 'success': return '✅'
      case 'danger': return '🔴'
      default: return 'ℹ️'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-[#6b7a99] hover:bg-gray-100 hover:text-[#1a2e4a] transition-all"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-[#1a2e4a]">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#1e4db7] hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-sm text-[#9aa5bf]">
                🔔 Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50
                    ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="text-lg">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-[#1a2e4a]' : 'text-gray-600'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time_ago}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-[#1e4db7] rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
            <button
              onClick={() => navigate('/notifications')}
              className="text-xs text-[#1e4db7] hover:underline"
            >
              Voir toutes les notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 