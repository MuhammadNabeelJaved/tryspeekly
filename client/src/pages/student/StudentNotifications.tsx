import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, Trash, Clock, Info, Warning, Star } from '@phosphor-icons/react'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'Assignment Graded',
    message: 'Your assignment for "Business English: Professional Communication" has been graded. You scored 92/100!',
    time: '2 hours ago',
    type: 'success',
    read: false
  },
  {
    id: 2,
    title: 'New Course Content',
    message: 'New video lectures and resources have been added to "Advanced IELTS Preparation".',
    time: '5 hours ago',
    type: 'info',
    read: false
  },
  {
    id: 3,
    title: 'Live Class Reminder',
    message: 'Your live session "Speaking Fluency Workshop" starts in 30 minutes. Join the classroom now.',
    time: '1 day ago',
    type: 'alert',
    read: true
  },
  {
    id: 4,
    title: 'Subscription Renewal',
    message: 'Your monthly subscription will renew in 3 days. Ensure your payment method is up to date.',
    time: '2 days ago',
    type: 'warning',
    read: true
  },
  {
    id: 5,
    title: 'Welcome to EnglishPro',
    message: 'Welcome to the platform! We\'re excited to have you here. Start by exploring our courses.',
    time: '1 week ago',
    type: 'info',
    read: true
  }
]

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

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

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} className="text-emerald-500" />
      case 'warning': return <Warning size={20} className="text-amber-500" />
      case 'alert': return <Bell size={20} className="text-rose-500" />
      default: return <Info size={20} className="text-violet-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">Stay updated with your learning progress and alerts.</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-neutral-800 rounded-2xl w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${filter === 'unread' ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white'}`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-violet-600 text-white flex items-center justify-center text-[10px]">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[24px] p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-neutral-700">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">All caught up!</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">You don't have any {filter === 'unread' ? 'unread' : ''} notifications at the moment.</p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              className={`group bg-white dark:bg-neutral-900 border rounded-[24px] p-4 sm:p-5 transition-all hover:shadow-md ${notif.read ? 'border-slate-200 dark:border-neutral-800' : 'border-violet-200 dark:border-violet-900/50 ring-1 ring-violet-50 dark:ring-violet-900/10'}`}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  notif.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                  notif.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30' :
                  notif.type === 'alert' ? 'bg-rose-50 dark:bg-rose-950/30' :
                  'bg-violet-50 dark:bg-violet-950/30'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-sm sm:text-base ${notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-black text-slate-900 dark:text-white'}`}>
                        {notif.title}
                        {!notif.read && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-violet-600 inline-block" />
                        )}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-neutral-500">
                      <Clock size={14} />
                      {notif.time}
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
