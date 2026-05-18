import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, Clock, Info, Warning, CreditCard, BookOpen, ChatCircle } from '@phosphor-icons/react'
import { notificationsService } from '@/services/notifications.service'
import type { Notification } from '@/types/api'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getIcon(type: Notification['type'], severity: Notification['severity']) {
  if (type === 'payment') return <CreditCard size={20} className="text-emerald-500" />
  if (type === 'course') return <BookOpen size={20} className="text-violet-500" />
  if (type === 'message') return <ChatCircle size={20} className="text-blue-500" />
  if (severity === 'high') return <Warning size={20} className="text-rose-500" />
  if (severity === 'medium') return <Warning size={20} className="text-amber-500" />
  return <Info size={20} className="text-violet-500" />
}

function getBg(type: Notification['type'], severity: Notification['severity']) {
  if (type === 'payment') return 'bg-emerald-50 dark:bg-emerald-950/30'
  if (type === 'course') return 'bg-violet-50 dark:bg-violet-950/30'
  if (type === 'message') return 'bg-blue-50 dark:bg-blue-950/30'
  if (severity === 'high') return 'bg-rose-50 dark:bg-rose-950/30'
  if (severity === 'medium') return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-violet-50 dark:bg-violet-950/30'
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const fetchNotifications = useCallback(() => {
    setLoading(true)
    notificationsService.getMyNotifications({ limit: 50 })
      .then(res => setNotifications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = async (id: string) => {
    await notificationsService.markAsRead(id)
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">Stay updated with your learning progress and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="px-4 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-neutral-800 rounded-2xl w-fit">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${filter === f ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white'}`}>
            {f === 'all' ? 'All' : 'Unread'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-[24px] p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-neutral-800 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[24px] p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-neutral-700">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">
              You don't have any {filter === 'unread' ? 'unread' : ''} notifications at the moment.
            </p>
          </div>
        ) : (
          filtered.map((notif, index) => (
            <motion.div key={notif._id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
              className={`group bg-white dark:bg-neutral-900 border rounded-[24px] p-4 sm:p-5 transition-all hover:shadow-md ${notif.read ? 'border-slate-200 dark:border-neutral-800' : 'border-violet-200 dark:border-violet-900/50 ring-1 ring-violet-50 dark:ring-violet-900/10'}`}>
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${getBg(notif.type, notif.severity)}`}>
                  {getIcon(notif.type, notif.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-sm sm:text-base ${notif.read ? 'font-bold' : 'font-black'} text-slate-900 dark:text-white`}>
                        {notif.title}
                        {!notif.read && <span className="ml-2 w-2 h-2 rounded-full bg-violet-600 inline-block" />}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <button onClick={() => markAsRead(notif._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg"
                        title="Mark as read">
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-neutral-500">
                      <Clock size={14} />
                      {timeAgo(notif.createdAt)}
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <span className="text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      {notif.type}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
