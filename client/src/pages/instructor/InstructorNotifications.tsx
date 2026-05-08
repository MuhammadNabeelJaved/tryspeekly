import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCircle, Trash, Clock, Info, Users, ChatCircleDots, VideoCamera } from '@phosphor-icons/react'

interface Notification {
  id: number
  title: string
  message: string
  time: string
  type: 'student' | 'message' | 'system' | 'class'
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'New Student Enrollment',
    message: 'Ali Khan has enrolled in your "Advanced Business English" course.',
    time: '15 minutes ago',
    type: 'student',
    read: false
  },
  {
    id: 2,
    title: 'New Message',
    message: 'You have a new message from Sarah Jenkins regarding the last assignment.',
    time: '45 minutes ago',
    type: 'message',
    read: false
  },
  {
    id: 3,
    title: 'Upcoming Live Class',
    message: 'Reminder: Your live session "Speaking Practice" starts in 1 hour.',
    time: '2 hours ago',
    type: 'class',
    read: true
  },
  {
    id: 4,
    title: 'Course Review',
    message: 'A student left a 5-star review on "IELTS Speaking Mastery".',
    time: '1 day ago',
    type: 'student',
    read: false
  },
  {
    id: 5,
    title: 'Platform Maintenance',
    message: 'The instructor portal will be down for maintenance on Sunday at 2:00 AM UTC.',
    time: '2 days ago',
    type: 'system',
    read: true
  }
]

export default function InstructorNotifications() {
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
      case 'student': return <Users size={20} className="text-blue-500" />
      case 'message': return <ChatCircleDots size={20} className="text-emerald-500" />
      case 'class': return <VideoCamera size={20} className="text-rose-500" />
      default: return <Info size={20} className="text-violet-500" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">Keep track of student activity and your teaching schedule.</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="px-5 py-2.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-2xl transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800">
        <button
          onClick={() => setFilter('all')}
          className={`px-6 py-3 text-sm font-bold transition-all relative ${filter === 'all' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-neutral-500'}`}
        >
          All Notifications
          {filter === 'all' && (
            <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
          )}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-6 py-3 text-sm font-bold transition-all relative flex items-center gap-2 ${filter === 'unread' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-neutral-500'}`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full text-[10px]">
              {unreadCount}
            </span>
          )}
          {filter === 'unread' && (
            <motion.div layoutId="notifTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
          )}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-neutral-600">
              <Bell size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No notifications</h3>
            <p className="text-slate-500 dark:text-neutral-400 mt-2">We'll notify you when something important happens.</p>
          </div>
        ) : (
          filteredNotifications.map((notif, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={notif.id}
              className={`group bg-white dark:bg-neutral-900 border rounded-3xl p-5 transition-all hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-black/40 ${notif.read ? 'border-slate-100 dark:border-neutral-800/60' : 'border-violet-100 dark:border-violet-900/30 ring-1 ring-violet-50/50 dark:ring-violet-900/5'}`}
            >
              <div className="flex gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  notif.type === 'student' ? 'bg-blue-50 dark:bg-blue-950/30' :
                  notif.type === 'message' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                  notif.type === 'class' ? 'bg-rose-50 dark:bg-rose-950/30' :
                  'bg-violet-50 dark:bg-violet-950/30'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className={`text-base ${notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-black text-slate-900 dark:text-white'}`}>
                        {notif.title}
                        {!notif.read && (
                          <span className="ml-2 w-2 h-2 rounded-full bg-violet-600 inline-block align-middle" />
                        )}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 mt-1.5 leading-relaxed font-medium">
                        {notif.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
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
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-neutral-800" />
                    <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
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
