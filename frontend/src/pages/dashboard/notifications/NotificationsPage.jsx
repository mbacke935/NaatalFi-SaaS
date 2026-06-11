import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiBell,
  FiCheck,
  FiCheckCircle,
  FiBriefcase,
  FiCreditCard,
  FiShoppingBag,
  FiUser,
} from 'react-icons/fi'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../services/notifications'

const typeConfig = {
  ACCOUNT: { icon: FiUser, tone: 'text-blue-400' },
  ORDER: { icon: FiShoppingBag, tone: 'text-[#D4AF37]' },
  PAYMENT: { icon: FiCreditCard, tone: 'text-green-400' },
  VENDOR: { icon: FiBriefcase, tone: 'text-purple-400' },
  WALLET: { icon: FiCreditCard, tone: 'text-indigo-400' },
  SYSTEM: { icon: FiBell, tone: 'text-gray-300' },
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications]
  )

  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
      setError('')
    } catch {
      setError('Impossible de charger les notifications.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = window.setInterval(
      () => fetchNotifications({ silent: true }),
      30000
    )
    return () => window.clearInterval(interval)
  }, [fetchNotifications])

  const handleMarkRead = async (notification) => {
    if (notification.is_read) return
    setNotifications((items) =>
      items.map((item) => item.id === notification.id ? { ...item, is_read: true } : item)
    )
    try {
      await markNotificationRead(notification.id)
    } catch {
      fetchNotifications({ silent: true })
    }
  }

  const handleReadAll = async () => {
    if (!unreadCount) return
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      fetchNotifications({ silent: true })
    }
  }

  if (loading) {
    return <div className="h-40 bg-[#16161E] border border-[#2a2a3a] rounded-xl animate-pulse" />
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleReadAll}
          disabled={!unreadCount}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FiCheck size={16} />
          Tout marquer lu
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl p-12 text-center">
          <FiBell className="text-gray-600 mx-auto mb-3" size={32} />
          <p className="text-sm text-gray-500">Aucune notification pour le moment.</p>
        </div>
      ) : (
        <div className="bg-[#16161E] border border-[#2a2a3a] rounded-xl overflow-hidden">
          {notifications.map((notification) => {
            const cfg = typeConfig[notification.type] || typeConfig.SYSTEM
            const Icon = cfg.icon
            const content = (
              <>
                <div className="w-10 h-10 rounded-lg bg-[#0B0B0F] border border-[#2a2a3a] flex items-center justify-center flex-shrink-0">
                  <Icon className={cfg.tone} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] flex-shrink-0" />
                    )}
                    <p className="text-sm text-white font-medium truncate">
                      {notification.title || notification.type}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{notification.message}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-xs text-gray-600 whitespace-nowrap">{formatDate(notification.created_at)}</p>
                  {notification.is_read && <FiCheckCircle className="text-green-500" size={16} />}
                </div>
              </>
            )

            const className = `flex items-center gap-4 px-5 py-4 border-b border-[#2a2a3a] last:border-0 hover:bg-white/5 transition ${
              notification.is_read ? 'opacity-70' : ''
            }`

            return notification.link_url ? (
              <Link
                key={notification.id}
                to={notification.link_url}
                onClick={() => handleMarkRead(notification)}
                className={className}
              >
                {content}
              </Link>
            ) : (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleMarkRead(notification)}
                className={`${className} w-full text-left`}
              >
                {content}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
