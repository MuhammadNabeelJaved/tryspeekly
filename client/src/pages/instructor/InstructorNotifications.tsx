import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bell, CheckCircle, Clock, Info, Warning, BookOpen, ChatCircle, VideoCamera,
  MagnifyingGlass, X,
} from '@phosphor-icons/react'
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
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getIcon(type: Notification['type'], severity: Notification['severity']) {
  if (type === 'course') return <BookOpen size={20} className="text-violet-500" />
  if (type === 'message') return <ChatCircle size={20} className="text-blue-500" />
  if (severity === 'high') return <VideoCamera size={20} className="text-rose-500" />
  if (severity === 'medium') return <Warning size={20} className="text-amber-500" />
  return <Info size={20} className="text-violet-500" />
}

function getBg(type: Notification['type'], severity: Notification['severity']) {
  if (type === 'course') return 'bg-violet-50 dark:bg-violet-950/30'
  if (type === 'message') return 'bg-blue-50 dark:bg-blue-950/30'
  if (severity === 'high') return 'bg-rose-50 dark:bg-rose-950/30'
  if (severity === 'medium') return 'bg-amber-50 dark:bg-amber-950/30'
  return 'bg-slate-50 dark:bg-neutral-800'
}

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'system', label: 'System' },
  { value: 'course', label: 'Course' },
  { value: 'message', label: 'Message' },
  { value: 'user', label: 'User' },
]

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severity' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const selectCls =
  'px-3 py-2 text-xs font-semibold bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all cursor-pointer'

export default function InstructorNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setSeverityFilter('all')
    setDateFrom('')
    setDateTo('')
    setReadFilter('all')
  }

  const activeFilterCount = [
    readFilter !== 'all',
    typeFilter !== 'all',
    severityFilter !== 'all',
    !!dateFrom,
    !!dateTo,
    !!search,
  ].filter(Boolean).length

  const filtered = notifications.filter(n => {
    if (readFilter === 'unread' && n.read) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (severityFilter !== 'all' && n.severity !== severityFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false
    }
    if (dateFrom && new Date(n.createdAt) < new Date(dateFrom)) return false
    if (dateTo && new Date(n.createdAt) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Notifications</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">Stay updated with your teaching activity and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="px-4 py-2 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors">
            Mark all as read
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or message…"
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Read status */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setReadFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${readFilter === f ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white'}`}>
              {f === 'all' ? 'All' : 'Unread'}
              {f === 'unread' && unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-violet-600 text-white flex items-center justify-center text-[9px]">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Type */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={selectCls}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Severity */}
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className={selectCls}>
          {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Date from */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={selectCls} />
        </div>

        {/* Date to */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400">To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={selectCls} />
        </div>

        {/* Clear */}
        {activeFilterCount > 0 && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
            <X size={12} />
            Clear ({activeFilterCount})
          </button>
        )}

        <span className="ml-auto text-xs font-semibold text-slate-400 dark:text-neutral-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
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
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No notifications found</h3>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mt-1">
              {activeFilterCount > 0 ? 'Try adjusting your filters.' : 'No notifications at the moment.'}
            </p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline">
                Clear all filters
              </button>
            )}
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
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-neutral-500">
                      <Clock size={14} />
                      {timeAgo(notif.createdAt)}
                    </div>
                    <span className="text-slate-200 dark:text-neutral-700">·</span>
                    <span className="text-[10px] sm:text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-200 dark:text-neutral-700">·</span>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${notif.severity === 'high' ? 'text-rose-500' : notif.severity === 'medium' ? 'text-amber-500' : 'text-slate-400 dark:text-neutral-500'}`}>
                      {notif.severity}
                    </span>
                    <span className="text-slate-200 dark:text-neutral-700">·</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-neutral-500">
                      {new Date(notif.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
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
