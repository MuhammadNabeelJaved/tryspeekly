import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, Trash, Clock, Info, UserPlus, CreditCard, ShieldCheck } from '@phosphor-icons/react'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  category: 'system' | 'user' | 'payment' | 'security'
  severity: 'low' | 'medium' | 'high'
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'New Student Registration',
    message: 'John Doe has registered as a new student.',
    time: '5 minutes ago',
    category: 'user',
    severity: 'low',
    read: false
  },
  {
    id: 2,
    title: 'Payment Failed',
    message: 'Payment for subscription failed for student: Sarah Smith (ID: #12930).',
    time: '2 hours ago',
    category: 'payment',
    severity: 'high',
    read: false
  },
  {
    id: 3,
    title: 'System Update Completed',
    message: 'Version 2.4.0 has been successfully deployed to production.',
    time: '5 hours ago',
    category: 'system',
    severity: 'medium',
    read: true
  },
  {
    id: 4,
    title: 'Suspicious Login Attempt',
    message: 'Multiple failed login attempts detected from IP 192.168.1.1 for admin account.',
    time: '1 day ago',
    category: 'security',
    severity: 'high',
    read: false
  },
  {
    id: 5,
    title: 'New Instructor Application',
    message: 'Dr. Emily Watson has submitted an application to become an instructor.',
    time: '2 days ago',
    category: 'user',
    severity: 'medium',
    read: true
  }
]

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'high'>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'high') return n.severity === 'high'
    return true
  })

  const getIcon = (category: Notification['category']) => {
    switch (category) {
      case 'user': return <UserPlus size={20} className="text-blue-500" />
      case 'payment': return <CreditCard size={20} className="text-emerald-500" />
      case 'security': return <ShieldCheck size={20} className="text-rose-500" />
      default: return <Info size={20} className="text-violet-500" />
    }
  }

  const getSeverityStyle = (severity: Notification['severity']) => {
    switch (severity) {
      case 'high': return 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50'
      case 'medium': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'
      default: return 'text-slate-600 bg-slate-50 dark:bg-neutral-800 border-slate-100 dark:border-neutral-700'
    }
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Alerts</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1.5">Monitor system activity, user registrations, and security events.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-5 py-2.5 text-xs font-black bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 rounded-2xl transition-all shadow-sm"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-neutral-900 rounded-[20px] w-fit">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-2xl text-xs font-black transition-all ${filter === 'all' ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-black/20' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-6 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 ${filter === 'unread' ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-black/20' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-6 py-2 rounded-2xl text-xs font-black transition-all ${filter === 'high' ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-md shadow-slate-200/50 dark:shadow-black/20' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
          >
            Critical
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="grid gap-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[32px] p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-slate-50 dark:bg-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-neutral-700">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Clear Skies</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2 max-w-xs mx-auto">No {filter !== 'all' ? filter : ''} notifications found. Everything is running smoothly.</p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              className={`group relative bg-white dark:bg-neutral-900 border rounded-[28px] p-5 sm:p-6 transition-all hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-black/40 ${notif.read ? 'border-slate-100 dark:border-neutral-800' : 'border-violet-100 dark:border-violet-900/40 bg-violet-50/[0.02] dark:bg-violet-900/[0.01]'}`}
            >
              <div className="flex gap-5 sm:gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  notif.category === 'user' ? 'bg-blue-50 dark:bg-blue-950/30' :
                  notif.category === 'payment' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                  notif.category === 'security' ? 'bg-rose-50 dark:bg-rose-950/30' :
                  'bg-violet-50 dark:bg-violet-950/30'
                }`}>
                  {getIcon(notif.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-base tracking-tight ${notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-black text-slate-900 dark:text-white'}`}>
                          {notif.title}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getSeverityStyle(notif.severity)}`}>
                          {notif.severity}
                        </span>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-all"
                          title="Mark as read"
                        >
                          <CheckCircle size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                        title="Delete"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-neutral-500">
                      <Clock size={16} />
                      {notif.time}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                      {notif.category}
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
