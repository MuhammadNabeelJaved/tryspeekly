import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass, X, UserCircle, CheckCircle, Warning,
  ArrowsClockwise, Student, ChalkboardTeacher, UserGear, Crown,
  FunnelSimple, ProhibitInset, Trash, LockOpen, MonitorPlay,
  type Icon as IconType,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { axiosClient } from '@/lib/axiosClient'
import UserAvatar from '@/components/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/services/users.service'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'student' | 'teacher' | 'team_member' | 'admin'

interface PlatformUser {
  _id: string
  name: string
  email: string
  role: Role
  isVerified: boolean
  isBlocked: boolean
  showOnCoursesPage?: boolean
  profileImage?: string
  jobTitle?: string
  createdAt: string
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLES: { value: Role; label: string; color: string; Icon: IconType }[] = [
  { value: 'student',     label: 'Student',     color: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',            Icon: Student },
  { value: 'teacher',     label: 'Teacher',     color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', Icon: ChalkboardTeacher },
  { value: 'team_member', label: 'Team Member', color: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',    Icon: UserGear },
  { value: 'admin',       label: 'Admin',       color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',        Icon: Crown },
]

function RoleBadge({ role }: { role: Role }) {
  const meta = ROLES.find(r => r.value === role)
  if (!meta) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
      <meta.Icon size={10} weight="fill" />
      {meta.label}
    </span>
  )
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

type ConfirmVariant = 'delete' | 'block' | 'unblock'

interface ConfirmModalProps {
  user: PlatformUser
  variant: ConfirmVariant
  onClose: () => void
  onConfirm: () => Promise<void>
}

function ConfirmModal({ user, variant, onClose, onConfirm }: ConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const META: Record<ConfirmVariant, { title: string; body: string; btnLabel: string; btnCls: string; Icon: IconType }> = {
    delete: {
      title:    'Delete Account',
      body:     `This will permanently delete ${user.name}'s account. They will not be able to log in and their email cannot be reused. This action cannot be undone.`,
      btnLabel: 'Delete Account',
      btnCls:   'bg-red-600 hover:bg-red-700',
      Icon:     Trash,
    },
    block: {
      title:    'Block User',
      body:     `${user.name} (${user.email}) will be blocked immediately. They won't be able to log in or create a new account with this email.`,
      btnLabel: 'Block User',
      btnCls:   'bg-orange-600 hover:bg-orange-700',
      Icon:     ProhibitInset,
    },
    unblock: {
      title:    'Unblock User',
      body:     `${user.name} (${user.email}) will be unblocked and can log in again.`,
      btnLabel: 'Unblock User',
      btnCls:   'bg-emerald-600 hover:bg-emerald-700',
      Icon:     LockOpen,
    },
  }

  const meta = META[variant]

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            variant === 'delete' ? 'bg-red-100 dark:bg-red-950/40' :
            variant === 'block'  ? 'bg-orange-100 dark:bg-orange-950/40' :
                                   'bg-emerald-100 dark:bg-emerald-950/40'
          }`}>
            <meta.Icon size={20} weight="fill" className={
              variant === 'delete' ? 'text-red-600 dark:text-red-400' :
              variant === 'block'  ? 'text-orange-600 dark:text-orange-400' :
                                     'text-emerald-600 dark:text-emerald-400'
            } />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">{meta.title}</h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">{meta.body}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${meta.btnCls}`}
          >
            {loading ? <ArrowsClockwise size={13} className="animate-spin" /> : null}
            {loading ? 'Please wait…' : meta.btnLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Role Change Modal ────────────────────────────────────────────────────────

function RoleModal({ user, onClose, onChanged }: {
  user: PlatformUser
  onClose: () => void
  onChanged: (userId: string, newRole: Role) => void
}) {
  const [selected, setSelected] = useState<Role>(user.role)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (selected === user.role) { onClose(); return }
    setLoading(true)
    try {
      await axiosClient.patch(`/users/${user._id}/role`, { role: selected })
      onChanged(user._id, selected)
      toast.success(`${user.name}'s role changed to ${ROLES.find(r => r.value === selected)?.label}`)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to change role'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Change Role</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl mb-5">
          <UserAvatar src={user.profileImage} name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-3">Select new role</p>
        <div className="space-y-2 mb-6">
          {ROLES.map(({ value, label, Icon, color }) => (
            <button
              key={value}
              onClick={() => setSelected(value)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                selected === value
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                  : 'border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-slate-300 dark:hover:border-neutral-600'
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon size={14} weight="fill" />
              </span>
              {label}
              {value === user.role && (
                <span className="ml-auto text-[10px] font-bold text-slate-400 dark:text-neutral-600">Current</span>
              )}
              {selected === value && value !== user.role && (
                <CheckCircle size={16} weight="fill" className="ml-auto text-violet-500" />
              )}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || selected === user.role}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ArrowsClockwise size={14} className="animate-spin" /> : null}
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Bulk Delete Confirm Modal ────────────────────────────────────────────────

function BulkDeleteConfirmModal({ count, onClose, onConfirm }: {
  count: number
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm(); onClose() } finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <Trash size={20} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Delete {count} account{count !== 1 ? 's' : ''}?
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
              This will permanently delete {count} user account{count !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <ArrowsClockwise size={13} className="animate-spin" /> : null}
            {loading ? 'Deleting…' : `Delete ${count}`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ROLE_FILTERS: { label: string; value: Role | 'all' | 'blocked' }[] = [
  { label: 'All Users',    value: 'all' },
  { label: 'Students',     value: 'student' },
  { label: 'Teachers',     value: 'teacher' },
  { label: 'Team Members', value: 'team_member' },
  { label: 'Admins',       value: 'admin' },
  { label: 'Blocked',      value: 'blocked' },
]

type ConfirmState = { user: PlatformUser; variant: ConfirmVariant } | null

export default function AdminUsers() {
  const [users, setUsers]         = useState<PlatformUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all' | 'blocked'>('all')
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)

  const { user: currentUser } = useAuth()
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const allSelectableIds = users.filter(u => u._id !== currentUser?.id).map(u => u._id)
  const allSelected      = allSelectableIds.length > 0 && allSelectableIds.every(id => selectedIds.has(id))

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search.trim()) params.set('search', search.trim())
      if (roleFilter !== 'all' && roleFilter !== 'blocked') params.set('role', roleFilter)
      if (roleFilter === 'blocked') params.set('blocked', 'true')
      const res = await axiosClient.get(`/users?${params}`)
      setUsers(res.data.data)
      setTotalPages(res.data.pagination?.totalPages ?? 1)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])
  useEffect(() => { setPage(1); setSelectedIds(new Set()) }, [search, roleFilter])

  // ── Action handlers ──────────────────────────────────────────────────────────

  const handleRoleChanged = (userId: string, newRole: Role) => {
    setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u))
  }

  const handleCoursesPageToggle = async (u: PlatformUser) => {
    try {
      const res = await axiosClient.patch(`/users/${u._id}/show-on-courses`)
      const updated: PlatformUser = res.data.data
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, showOnCoursesPage: updated.showOnCoursesPage } : x))
      toast.success(updated.showOnCoursesPage ? 'Instructor shown on Courses page' : 'Instructor hidden from Courses page')
    } catch {
      toast.error('Failed to update instructor visibility')
    }
  }

  const handleBlockToggle = async (u: PlatformUser) => {
    try {
      const res = await axiosClient.patch(`/users/${u._id}/block`)
      const updated: PlatformUser = res.data.data
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isBlocked: updated.isBlocked } : x))
      toast.success(updated.isBlocked ? `${u.name} has been blocked.` : `${u.name} has been unblocked.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Action failed'
      toast.error(msg)
    }
  }

  const handleDelete = async (u: PlatformUser) => {
    try {
      await axiosClient.delete(`/users/${u._id}`)
      setUsers(prev => prev.filter(x => x._id !== u._id))
      toast.success(`${u.name}'s account has been deleted.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Delete failed'
      toast.error(msg)
      throw err
    }
  }

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds)
      await usersService.bulkDelete(ids)
      setUsers(prev => prev.filter(u => !selectedIds.has(u._id)))
      setSelectedIds(new Set())
      toast.success(`${ids.length} account${ids.length !== 1 ? 's' : ''} deleted.`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Bulk delete failed'
      toast.error(msg)
      throw err
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">All Users</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage roles, block, or delete any user account</p>
        </div>
        <div className="sm:ml-auto">
          <div className="relative">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 w-52 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Role filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <FunnelSimple size={14} className="text-slate-400 flex-shrink-0" />
        {ROLE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setRoleFilter(f.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              roleFilter === f.value
                ? f.value === 'blocked'
                  ? 'bg-red-600 text-white'
                  : 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white transition-colors font-medium">Clear</button>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Trash size={14} weight="bold" />
              Delete {selectedIds.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
            <ArrowsClockwise size={24} className="animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
            <UserCircle size={40} className="mb-3" />
            <p className="text-sm font-semibold">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={e => setSelectedIds(e.target.checked ? new Set(allSelectableIds) : new Set())}
                      className="w-4 h-4 rounded accent-violet-500"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">User</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest hidden md:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr
                    key={u._id}
                    className={`border-b border-slate-50 dark:border-neutral-800/50 last:border-0 transition-colors ${
                      u.isBlocked
                        ? 'bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                        : 'hover:bg-slate-50/50 dark:hover:bg-neutral-800/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u._id)}
                        onChange={() => toggleSelect(u._id)}
                        disabled={u._id === currentUser?.id}
                        className="w-4 h-4 rounded accent-violet-500 disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <UserAvatar src={u.profileImage} name={u.name} size="sm" />
                          {u.isBlocked && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <ProhibitInset size={9} weight="fill" className="text-white" />
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">{u.name}</p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-col gap-1">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                            <ProhibitInset size={11} weight="fill" />Blocked
                          </span>
                        ) : u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={11} weight="fill" />Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                            <Warning size={11} weight="fill" />Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-400 dark:text-neutral-500">
                        {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Change Role */}
                        <button
                          onClick={() => setSelectedUser(u)}
                          title="Change role"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 dark:text-neutral-400 hover:text-violet-700 dark:hover:text-violet-400 text-[11px] font-bold transition-colors"
                        >
                          Role
                        </button>

                        {/* Courses page visibility (teachers only) */}
                        {u.role === 'teacher' && (
                          <button
                            onClick={() => handleCoursesPageToggle(u)}
                            title={u.showOnCoursesPage ? 'Hide from Courses page' : 'Show on Courses page'}
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                              u.showOnCoursesPage
                                ? 'bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-950/60'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-400 dark:text-neutral-500 hover:bg-slate-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <MonitorPlay size={13} weight="fill" />
                          </button>
                        )}

                        {/* Block / Unblock */}
                        <button
                          onClick={() => setConfirmState({ user: u, variant: u.isBlocked ? 'unblock' : 'block' })}
                          title={u.isBlocked ? 'Unblock user' : 'Block user'}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                            u.isBlocked
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-950/60'
                              : 'bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-950/50'
                          }`}
                        >
                          {u.isBlocked
                            ? <LockOpen size={13} weight="fill" />
                            : <ProhibitInset size={13} weight="fill" />}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setConfirmState({ user: u, variant: 'delete' })}
                          title="Delete account"
                          className="w-7 h-7 rounded-xl bg-red-100 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/50 flex items-center justify-center transition-colors"
                        >
                          <Trash size={13} weight="fill" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
            Prev
          </button>
          <span className="text-xs font-semibold text-slate-400 dark:text-neutral-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
            Next
          </button>
        </div>
      )}

      {/* Role change modal */}
      <AnimatePresence>
        {selectedUser && (
          <RoleModal user={selectedUser} onClose={() => setSelectedUser(null)} onChanged={handleRoleChanged} />
        )}
      </AnimatePresence>

      {/* Confirm modal (block / unblock / delete) */}
      <AnimatePresence>
        {confirmState && (
          <ConfirmModal
            user={confirmState.user}
            variant={confirmState.variant}
            onClose={() => setConfirmState(null)}
            onConfirm={async () => {
              if (confirmState.variant === 'delete') {
                await handleDelete(confirmState.user)
              } else {
                await handleBlockToggle(confirmState.user)
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk delete confirm modal */}
      <AnimatePresence>
        {bulkDeleteOpen && (
          <BulkDeleteConfirmModal
            count={selectedIds.size}
            onClose={() => setBulkDeleteOpen(false)}
            onConfirm={handleBulkDelete}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
