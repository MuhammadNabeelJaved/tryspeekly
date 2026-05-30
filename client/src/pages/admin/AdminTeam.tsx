import { useState, useEffect, useRef } from 'react'
import { Users, Plus, PencilSimple, Trash, ChatCircleDots, X, Check } from '@phosphor-icons/react'

const TEAM_JOB_TITLES = [
  'Content Manager',
  'Marketing Manager',
  'Sales Executive',
  'Support Agent',
  'Curriculum Developer',
  'Video Editor',
  'Social Media Manager',
  'Finance Manager',
  'HR Manager',
  'Operations Manager',
  'Community Manager',
  'UI/UX Designer',
  'Technical Support',
  'Business Development',
  'Data Analyst',
]
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { teamService } from '@/services/team.service'
import { useSocket } from '@/context/SocketContext'
import { useAuth } from '@/context/AuthContext'
import type { TeamMember, TeamChatMessage } from '@/types/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

// ─── Permission Groups ────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
  {
    label: 'Core',
    items: [
      { key: 'overview', label: 'Overview' },
      { key: 'students', label: 'Students' },
      { key: 'courses', label: 'Courses' },
      { key: 'instructors', label: 'Instructors' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { key: 'payments', label: 'Payments' },
      { key: 'financial-aid', label: 'Financial Aid' },
      { key: 'salaries', label: 'Salaries' },
      { key: 'certificates', label: 'Certificates' },
      { key: 'referrals', label: 'Referrals' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'messages', label: 'Messages' },
      { key: 'support', label: 'Support' },
      { key: 'contacts', label: 'Contacts' },
      { key: 'email', label: 'Email System' },
      { key: 'newsletter', label: 'Newsletter' },
      { key: 'reviews', label: 'Reviews' },
      { key: 'notifications', label: 'Notifications' },
    ],
  },
  {
    label: 'Content',
    items: [
      { key: 'blog', label: 'Blog Manager' },
      { key: 'seo', label: 'SEO Manager' },
      { key: 'cms', label: 'CMS Editor' },
      { key: 'geo-access', label: 'Geo Access' },
    ],
  },
]

// ─── Member Modal ─────────────────────────────────────────────────────────────

interface MemberModalProps {
  member: TeamMember | null
  onClose: () => void
  onSave: (member: TeamMember) => void
}

function MemberModal({ member, onClose, onSave }: MemberModalProps) {
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const [jobTitle, setJobTitle] = useState(member?.jobTitle ?? '')
  const [permissions, setPermissions] = useState<string[]>(member?.permissions ?? [])
  const [saving, setSaving] = useState(false)

  const togglePermission = (key: string) => {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required.')
      return
    }
    if (!member && !password.trim()) {
      toast.error('Password is required for new members.')
      return
    }
    setSaving(true)
    try {
      let result: TeamMember
      if (member) {
        const res = await teamService.updateMember(member._id, {
          name, email, jobTitle, permissions,
        })
        result = res.data
        toast.success('Team member updated.')
      } else {
        const res = await teamService.createMember({
          name, email, password, jobTitle, permissions,
        })
        result = res.data
        toast.success('Team member created. Welcome email sent.')
      }
      onSave(result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to save team member.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Job Title</label>
              <select
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
              >
                <option value="">— Select title —</option>
                {TEAM_JOB_TITLES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
              placeholder="email@example.com"
              required
            />
          </div>

          {!member && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Initial Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
                placeholder="Min. 8 characters"
                minLength={8}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-3">Page Access</label>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => togglePermission(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          permissions.includes(item.key)
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700 hover:border-violet-400'
                        }`}
                      >
                        {permissions.includes(item.key) && <Check size={10} weight="bold" className="inline mr-1" />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : member ? 'Save Changes' : 'Create Member'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminTeam() {
  const { user } = useAuth()
  const { socket } = useSocket()

  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<TeamMember | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null)

  // Chat state
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Permissions saving debounce
  const permSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    teamService.listMembers()
      .then(res => setMembers(res.data))
      .catch(() => toast.error('Failed to load team members.'))
      .finally(() => setLoading(false))
  }, [])

  // Fetch chat thread when selection changes
  useEffect(() => {
    if (!selected) return
    setMessages([])
    teamService.getAdminThread(selected._id)
      .then(res => setMessages(res.data))
      .catch(() => toast.error('Failed to load messages.'))
    teamService.markAdminThreadRead(selected._id).catch(() => {})
  }, [selected?._id])

  // Socket listener for incoming team messages
  useEffect(() => {
    if (!socket) return
    const handler = (msg: TeamChatMessage) => {
      if (
        selected &&
        (
          (msg.from._id === selected._id && msg.to === user?._id) ||
          (msg.from._id === user?._id && msg.to === selected._id)
        )
      ) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }
    socket.on('team:message:received', handler)
    return () => { socket.off('team:message:received', handler) }
  }, [socket, selected, user])

  // Cleanup permSaveTimer on unmount
  useEffect(() => {
    return () => { if (permSaveTimer.current) clearTimeout(permSaveTimer.current) }
  }, [])

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleModalSave = (savedMember: TeamMember) => {
    if (editTarget) {
      setMembers(prev => prev.map(m => m._id === savedMember._id ? savedMember : m))
      if (selected?._id === savedMember._id) setSelected(savedMember)
    } else {
      setMembers(prev => [savedMember, ...prev])
    }
    setModalOpen(false)
    setEditTarget(null)
  }

  const handleDelete = async (member: TeamMember) => {
    try {
      await teamService.deleteMember(member._id)
      setMembers(prev => prev.filter(m => m._id !== member._id))
      if (selected?._id === member._id) setSelected(null)
      toast.success('Team member removed.')
    } catch {
      toast.error('Failed to remove team member.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handlePermissionToggle = (key: string) => {
    if (!selected) return
    const updated = selected.permissions.includes(key)
      ? selected.permissions.filter(p => p !== key)
      : [...selected.permissions, key]

    const updatedMember = { ...selected, permissions: updated }
    setSelected(updatedMember)
    setMembers(prev => prev.map(m => m._id === selected._id ? updatedMember : m))

    if (permSaveTimer.current) clearTimeout(permSaveTimer.current)
    permSaveTimer.current = setTimeout(() => {
      teamService.updateMember(selected._id, { permissions: updated })
        .catch(() => toast.error('Failed to save permissions.'))
    }, 600)
  }

  const handleSendMessage = async () => {
    if (!selected || !chatInput.trim() || sendingMessage) return
    if (!socket) { toast.error('Not connected. Please refresh.'); return }
    setSendingMessage(true)
    try {
      socket.emit('team:message:send', { toId: selected._id, message: chatInput.trim() })
      setChatInput('')
    } finally {
      setSendingMessage(false)
    }
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── LEFT: Member list ── */}
      <div className="w-72 flex-shrink-0 border-r border-slate-100 dark:border-neutral-800 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Team Members</h2>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
          >
            <Plus size={13} weight="bold" />
            Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && members.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-neutral-600">
              <Users size={28} className="mb-2" />
              <p className="text-xs font-medium">No team members yet</p>
            </div>
          )}
          {members.map(member => (
            <div
              key={member._id}
              onClick={() => setSelected(member)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setSelected(member)}
              className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                selected?._id === member._id
                  ? 'bg-violet-50 dark:bg-violet-950/30 border-r-2 border-violet-600'
                  : 'hover:bg-slate-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-sm font-black flex-shrink-0">
                {getInitials(member.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-600 truncate">{member.jobTitle || 'Team Member'}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setEditTarget(member); setModalOpen(true) }}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors"
                >
                  <PencilSimple size={13} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget(member) }}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      {!selected ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600">
          <Users size={40} className="mb-3" />
          <p className="text-sm font-medium">Select a team member to view details and chat</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Profile + Permissions */}
          <div className="flex-shrink-0 border-b border-slate-100 dark:border-neutral-800 p-5 overflow-y-auto max-h-[55%]">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 text-lg font-black">
                {getInitials(selected.name)}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">{selected.name}</h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400">{selected.jobTitle || 'Team Member'} · {selected.email}</p>
              </div>
            </div>

            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">Page Access</p>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold text-slate-300 dark:text-neutral-700 uppercase tracking-widest mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <button
                        key={item.key}
                        onClick={() => handlePermissionToggle(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selected.permissions.includes(item.key)
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-slate-50 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 border-slate-200 dark:border-neutral-700 hover:border-violet-400'
                        }`}
                      >
                        {selected.permissions.includes(item.key) && <Check size={10} weight="bold" className="inline mr-1" />}
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <ChatCircleDots size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">Chat with {selected.name}</span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-neutral-600 py-8">No messages yet. Say hello!</p>
              )}
              {messages.map(msg => {
                const isMe = msg.from._id === user?._id
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {msg.message}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-violet-200' : 'text-slate-400 dark:text-neutral-600'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2 px-5 py-3 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || sendingMessage}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <AnimatePresence>
        {modalOpen && (
          <MemberModal
            member={editTarget}
            onClose={() => { setModalOpen(false); setEditTarget(null) }}
            onSave={handleModalSave}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-2xl"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">Remove Team Member?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
                <strong>{deleteTarget.name}</strong> will lose access to the dashboard immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
