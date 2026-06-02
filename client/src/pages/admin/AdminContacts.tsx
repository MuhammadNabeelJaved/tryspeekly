import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass, Plus, Trash, PencilSimple, X, CheckCircle,
  EnvelopeSimple, Phone, Clock, Eye, EyeSlash, Warning,
  ChatCircleText, Funnel, ArrowClockwise, User,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { contactService } from '../../services/contact.service'
import ConfirmModal from '@/components/ConfirmModal'
import type { ContactMessage } from '../../types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | ContactMessage['status']

const STATUS_LABELS: Record<ContactMessage['status'], string> = {
  new: 'New',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  spam: 'Spam',
}

const STATUS_COLORS: Record<ContactMessage['status'], string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  spam: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', subject: '', message: '',
  status: 'new' as ContactMessage['status'], notes: '',
}

// ─── ContactFormModal ─────────────────────────────────────────────────────────

function ContactFormModal({
  contact,
  onClose,
  onSave,
}: {
  contact: ContactMessage | null
  onClose: () => void
  onSave: (data: typeof EMPTY_FORM) => Promise<void>
}) {
  const [form, setForm] = useState(
    contact
      ? { name: contact.name, email: contact.email, phone: contact.phone ?? '', subject: contact.subject, message: contact.message, status: contact.status, notes: contact.notes ?? '' }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Name, email, subject and message are required')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  const field = (id: string, label: string, type = 'text', required = false) => (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={(form as Record<string, string>)[id]}
        onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {contact ? 'Edit Contact' : 'Add New Contact'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 transition-colors">
            <X size={16} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field('name', 'Full Name', 'text', true)}
            {field('email', 'Email', 'email', true)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {field('phone', 'Phone')}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Status</label>
              <select
                id="status"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as ContactMessage['status'] }))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          {field('subject', 'Subject', 'text', true)}
          <div>
            <label htmlFor="message" className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">
              Message<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              id="message"
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-slate-600 dark:text-neutral-400 mb-1.5">Admin Notes</label>
            <textarea
              id="notes"
              rows={2}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Internal notes (not visible to user)..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
              {saving ? 'Saving...' : contact ? 'Save Changes' : 'Add Contact'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({
  contact,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleRead,
}: {
  contact: ContactMessage
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: ContactMessage['status']) => void
  onToggleRead: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[contact.status]}`}>
                {STATUS_LABELS[contact.status]}
              </span>
              {!contact.isRead && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                  Unread
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{contact.subject}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-400 transition-colors ml-3">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Sender info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs font-semibold mb-1">
                <User size={12} /> Name
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</p>
            </div>
            <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs font-semibold mb-1">
                <EnvelopeSimple size={12} /> Email
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{contact.email}</p>
            </div>
            {contact.phone && (
              <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-3.5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs font-semibold mb-1">
                  <Phone size={12} /> Phone
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{contact.phone}</p>
              </div>
            )}
            <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400 text-xs font-semibold mb-1">
                <Clock size={12} /> Received
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(contact.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-2 flex items-center gap-1.5">
              <ChatCircleText size={12} /> Message
            </p>
            <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-xl p-4 text-sm text-slate-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {contact.message}
            </div>
          </div>

          {/* Admin notes */}
          {contact.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-2">Admin Notes</p>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </div>
            </div>
          )}

          {/* Status selector */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STATUS_LABELS) as [ContactMessage['status'], string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => onStatusChange(val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    contact.status === val
                      ? STATUS_COLORS[val] + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onToggleRead}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              {contact.isRead ? <EyeSlash size={15} /> : <Eye size={15} />}
              {contact.isRead ? 'Mark Unread' : 'Mark Read'}
            </button>
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
            >
              <PencilSimple size={15} weight="bold" /> Edit
            </button>
            <button
              onClick={onDelete}
              className="py-2.5 px-4 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            >
              <Trash size={15} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminContacts() {
  const [contacts, setContacts] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const LIMIT = 20

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all')

  const [detailContact, setDetailContact] = useState<ContactMessage | null>(null)
  const [editContact, setEditContact] = useState<ContactMessage | null | 'new'>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkConfirm, setBulkConfirm] = useState(false)

  // Derived stats
  const [stats, setStats] = useState({ total: 0, unread: 0, new: 0, inProgress: 0, resolved: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, limit: LIMIT }
      if (search) params.search = search
      if (statusFilter !== 'all') params.status = statusFilter
      if (readFilter === 'unread') params.isRead = false
      if (readFilter === 'read') params.isRead = true

      const res = await contactService.getAllMessages(params as Parameters<typeof contactService.getAllMessages>[0])
      setContacts(res.data)
      setTotal(res.pagination?.total ?? res.data.length)

      // Fetch stats (all contacts without filter)
      const all = await contactService.getAllMessages({ limit: 1000 })
      const allData = all.data
      setStats({
        total: allData.length,
        unread: allData.filter(c => !c.isRead).length,
        new: allData.filter(c => c.status === 'new').length,
        inProgress: allData.filter(c => c.status === 'in_progress').length,
        resolved: allData.filter(c => c.status === 'resolved').length,
      })
    } catch {
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, readFilter])

  useEffect(() => { load() }, [load])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, statusFilter, readFilter])

  const handleSave = async (form: typeof EMPTY_FORM) => {
    try {
      if (editContact === 'new') {
        await contactService.createContact(form)
        toast.success('Contact added')
      } else if (editContact) {
        await contactService.updateMessage(editContact._id, form)
        toast.success('Contact updated')
        if (detailContact?._id === editContact._id) {
          setDetailContact(prev => prev ? { ...prev, ...form } : prev)
        }
      }
      setEditContact(null)
      load()
    } catch {
      toast.error('Failed to save contact')
      throw new Error('save failed')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await contactService.deleteMessage(deleteId)
      toast.success('Contact deleted')
      setDeleteId(null)
      if (detailContact?._id === deleteId) setDetailContact(null)
      load()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleBulkDelete = async () => {
    try {
      const res = await contactService.bulkDelete(Array.from(selectedIds))
      setContacts(prev => prev.filter(c => !selectedIds.has(c._id)))
      if (detailContact && selectedIds.has(detailContact._id)) setDetailContact(null)
      setSelectedIds(new Set())
      toast.success(res.message)
    } catch { toast.error('Failed to delete') } finally { setBulkConfirm(false) }
  }

  const handleStatusChange = async (contact: ContactMessage, status: ContactMessage['status']) => {
    try {
      await contactService.updateMessage(contact._id, { status })
      setContacts(prev => prev.map(c => c._id === contact._id ? { ...c, status } : c))
      if (detailContact?._id === contact._id) setDetailContact(prev => prev ? { ...prev, status } : prev)
      load()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleToggleRead = async (contact: ContactMessage) => {
    try {
      const isRead = !contact.isRead
      await contactService.updateMessage(contact._id, { isRead })
      setContacts(prev => prev.map(c => c._id === contact._id ? { ...c, isRead } : c))
      if (detailContact?._id === contact._id) setDetailContact(prev => prev ? { ...prev, isRead } : prev)
      load()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleCardClick = async (contact: ContactMessage) => {
    setDetailContact(contact)
    if (!contact.isRead) {
      try {
        await contactService.updateMessage(contact._id, { isRead: true })
        setContacts(prev => prev.map(c => c._id === contact._id ? { ...c, isRead: true } : c))
      } catch { /* silent */ }
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'spam', label: 'Spam' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-full">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mt-0.5">
            Messages from the contact form
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-500 dark:text-neutral-400 transition-colors">
            <ArrowClockwise size={16} weight="bold" />
          </button>
          <button
            onClick={() => setEditContact('new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} weight="bold" /> Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900 dark:text-white' },
          { label: 'Unread', value: stats.unread, color: 'text-violet-600 dark:text-violet-400' },
          { label: 'New', value: stats.new, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, email, subject..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            />
          </div>

          {/* Read filter */}
          <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 rounded-xl p-1">
            {([['all', 'All'], ['unread', 'Unread'], ['read', 'Read']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setReadFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  readFilter === key
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap mt-3">
          <Funnel size={14} className="text-slate-400 mt-2 flex-shrink-0" />
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl">
          <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChatCircleText size={28} className="text-slate-400" />
          </div>
          <p className="text-slate-900 dark:text-white font-bold mb-1">No contacts found</p>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map(contact => (
            <motion.div
              key={contact._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleCardClick(contact)}
              className={`group relative bg-white dark:bg-neutral-900 border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700/50 ${
                selectedIds.has(contact._id) ? 'border-red-300 dark:border-red-700/50 bg-red-50/20 dark:bg-red-950/5'
                : !contact.isRead ? 'border-violet-200 dark:border-violet-800/50'
                : 'border-slate-100 dark:border-neutral-800'
              }`}
            >
              <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(contact._id)} onChange={() => toggleSelect(contact._id)} className="w-4 h-4 rounded accent-violet-500" />
              </div>
              <div className="flex items-start gap-4 pl-5">
                {/* Unread dot */}
                <div className="mt-1 flex-shrink-0">
                  {!contact.isRead ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-neutral-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[contact.status]}`}>
                          {STATUS_LABELS[contact.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">{contact.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                        {new Date(contact.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                      {/* Quick actions (visible on hover) */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditContact(contact); setDetailContact(null) }}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors"
                        >
                          <PencilSimple size={12} weight="bold" />
                        </button>
                        <button
                          onClick={() => setDeleteId(contact._id)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition-colors"
                        >
                          <Trash size={12} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-neutral-200 mt-1 truncate">{contact.subject}</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 truncate">{contact.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-neutral-800">
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Page {page} of {totalPages} · {total} contacts
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {detailContact && (
          <DetailModal
            contact={detailContact}
            onClose={() => setDetailContact(null)}
            onEdit={() => { setEditContact(detailContact); setDetailContact(null) }}
            onDelete={() => { setDeleteId(detailContact._id); setDetailContact(null) }}
            onStatusChange={status => handleStatusChange(detailContact, status)}
            onToggleRead={() => handleToggleRead(detailContact)}
          />
        )}
        {editContact !== null && (
          <ContactFormModal
            contact={editContact === 'new' ? null : editContact}
            onClose={() => setEditContact(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Warning size={24} weight="fill" className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-2">Delete Contact?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 text-center mb-6">
                This action cannot be undone. The contact will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleting ? 'Deleting...' : <><CheckCircle size={15} weight="bold" /> Delete</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating bulk bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-medium">Clear</button>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <button onClick={() => setBulkConfirm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
              <Trash size={14} weight="bold" /> Delete {selectedIds.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal open={bulkConfirm} title={`Delete ${selectedIds.size} Message${selectedIds.size !== 1 ? 's' : ''}?`} message="This will permanently remove the selected contact messages. This cannot be undone." confirmLabel={`Delete ${selectedIds.size}`} variant="danger" onConfirm={handleBulkDelete} onCancel={() => setBulkConfirm(false)} />
    </div>
  )
}
