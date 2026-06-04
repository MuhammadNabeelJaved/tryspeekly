import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatCircleDots, PaperPlaneRight, EnvelopeSimple, Plus, Clock,
  CheckCircle, X, SpinnerGap, Warning
} from '@phosphor-icons/react'
import { supportService } from '@/services/support.service'
import type { SupportTicket } from '@/types/api'
import { config } from '@/config/env'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function StatusBadge({ status }: { status: SupportTicket['status'] }) {
  if (status === 'closed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
      <CheckCircle size={10} weight="fill" /> Closed
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
      <Clock size={10} weight="fill" /> Pending
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
      <Warning size={10} weight="fill" /> Open
    </span>
  )
}

interface NewTicketFormProps {
  onCancel: () => void
  onCreated: () => void
}

function NewTicketForm({ onCancel, onCreated }: NewTicketFormProps) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) { setError('Subject and description are required.'); return }
    setError('')
    setSubmitting(true)
    try {
      await supportService.createTicket({ subject, description, priority })
      onCreated()
    } catch {
      setError('Failed to create ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-slate-900 dark:text-white">New Support Ticket</h3>
        <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Subject</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} required
            placeholder="Brief summary of your issue"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-colors ${priority === p
                  ? p === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : p === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4}
            placeholder="Describe your issue in detail..."
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none" />
        </div>

        {error && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>}

        <div className="flex gap-3">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-bold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2">
            {submitting ? <><SpinnerGap size={14} className="animate-spin" /> Submitting...</> : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default function StudentSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchTickets = useCallback(() => {
    setLoading(true)
    supportService.getMyTickets()
      .then(res => {
        setTickets(res.data)
        setSelectedTicket(prev => prev ? (res.data.find(t => t._id === prev._id) ?? null) : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedTicket?.messages])

  const refreshSelectedTicket = useCallback(async (id: string) => {
    const res = await supportService.getTicketById(id)
    if (res.success) setSelectedTicket(res.data)
  }, [])

  const handleSelectTicket = useCallback(async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setShowNewForm(false)
    const res = await supportService.getTicketById(ticket._id)
    if (res.success) setSelectedTicket(res.data)
  }, [])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket || !reply.trim()) return
    setSending(true)
    try {
      await supportService.replyToTicket(selectedTicket._id, reply)
      setReply('')
      await refreshSelectedTicket(selectedTicket._id)
      fetchTickets()
    } catch {
      // silent fail
    } finally {
      setSending(false)
    }
  }

  const handleTicketCreated = () => {
    setShowNewForm(false)
    fetchTickets()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Support</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Need help? Create a ticket and we'll get back to you shortly.</p>
        </div>
        <button onClick={() => { setShowNewForm(true); setSelectedTicket(null) }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors">
          <Plus size={16} weight="bold" /> New Ticket
        </button>
      </div>

      <AnimatePresence>
        {showNewForm && (
          <NewTicketForm onCancel={() => setShowNewForm(false)} onCreated={handleTicketCreated} />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ticket List */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Your Tickets</h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-3/4 mb-2" />
                  <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded w-1/2" />
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <ChatCircleDots size={28} className="mx-auto text-slate-300 dark:text-neutral-700 mb-2" />
                <p className="text-xs text-slate-500 dark:text-neutral-400">No tickets yet</p>
              </div>
            ) : (
              tickets.map(ticket => (
                <button key={ticket._id} onClick={() => handleSelectTicket(ticket)}
                  className={`w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 ${selectedTicket?._id === ticket._id ? 'bg-violet-50 dark:bg-violet-900/10 border-r-2 border-violet-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 flex-1">{ticket.subject}</p>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500">{timeAgo(ticket.lastMessageAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-[450px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <ChatCircleDots size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight line-clamp-1">{selectedTicket.subject}</h3>
                    <p className="text-[10px] text-slate-400">Ticket #{selectedTicket._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-neutral-900/50">
                {(selectedTicket.messages ?? []).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-slate-400">No messages yet. Start the conversation below.</p>
                  </div>
                ) : (
                  (selectedTicket.messages ?? []).map(msg => (
                    <div key={msg._id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-2xl px-4 py-2 max-w-[80%] shadow-sm ${
                        msg.sender === 'student'
                          ? 'bg-violet-600 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.sender === 'student' ? 'text-violet-200' : 'text-slate-400 dark:text-neutral-500'}`}>
                          {timeAgo(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedTicket.status !== 'closed' ? (
                <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2">
                  <input value={reply} onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors" />
                  <button type="submit" disabled={!reply.trim() || sending}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white w-11 rounded-xl flex items-center justify-center transition-colors">
                    {sending ? <SpinnerGap size={18} className="animate-spin" /> : <PaperPlaneRight size={18} weight="fill" />}
                  </button>
                </form>
              ) : (
                <div className="p-3 border-t border-slate-100 dark:border-neutral-800 text-center">
                  <p className="text-xs text-slate-400 dark:text-neutral-500">This ticket is closed.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-neutral-800 flex items-center justify-center">
                <ChatCircleDots size={28} className="text-slate-300 dark:text-neutral-700" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Select a ticket</p>
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Choose a ticket to view the conversation, or create a new one.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <EnvelopeSimple size={20} className="text-violet-600" /> Direct Email
          </h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-3">Prefer email? Reach us directly.</p>
          <a href={`mailto:${config.supportEmail}`}
            className="block text-center w-full bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            {config.supportEmail}
          </a>
        </div>

        <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 p-5">
          <h3 className="font-bold text-violet-900 dark:text-violet-100 mb-1">Office Hours</h3>
          <p className="text-sm text-violet-700 dark:text-violet-300">Mon - Sat<br />9:00 AM – 6:00 PM PKT</p>
        </div>
      </div>
    </div>
  )
}
