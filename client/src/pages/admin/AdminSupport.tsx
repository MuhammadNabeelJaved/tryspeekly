import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatCircleDots, MagnifyingGlass, ArrowLeft, PaperPlaneRight, Check,
  ClipboardText, Clock, CheckCircle, Warning, PencilSimple, Trash, Plus,
  BookOpen,
} from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { INITIAL_SUPPORT_TICKETS, INITIAL_FAQS } from './adminData'
import type { SupportTicket, SupportMessage, FAQEntry } from './adminData'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  closed: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  medium: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
  high: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function calcAvgResponse(tickets: SupportTicket[]): string {
  const times: number[] = []
  for (const t of tickets) {
    const firstStudent = t.messages.find(m => m.sender === 'student')
    const firstAdmin = t.messages.find(m => m.sender === 'admin')
    if (firstStudent && firstAdmin) {
      const diff = new Date(firstAdmin.timestamp).getTime() - new Date(firstStudent.timestamp).getTime()
      if (diff > 0) times.push(diff)
    }
  }
  if (times.length === 0) return 'N/A'
  const avgMs = times.reduce((a, b) => a + b, 0) / times.length
  const totalMinutes = Math.round(avgMs / 60000)
  if (totalMinutes === 0) return '< 1m'
  if (totalMinutes < 60) return `${totalMinutes}m`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function SupportStats({ tickets }: { tickets: SupportTicket[] }) {
  const stats = [
    {
      label: 'Open',
      value: tickets.filter(t => t.status === 'open').length,
      Icon: ClipboardText,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
      iconBg: 'bg-emerald-500',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'Pending',
      value: tickets.filter(t => t.status === 'pending').length,
      Icon: Warning,
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
      iconBg: 'bg-amber-500',
      valueColor: 'text-amber-700 dark:text-amber-400',
    },
    {
      label: 'Closed',
      value: tickets.filter(t => t.status === 'closed').length,
      Icon: CheckCircle,
      bg: 'bg-slate-50 dark:bg-neutral-800/60 border-slate-100 dark:border-neutral-700',
      iconBg: 'bg-slate-500 dark:bg-neutral-600',
      valueColor: 'text-slate-700 dark:text-neutral-300',
    },
    {
      label: 'Avg Response',
      value: calcAvgResponse(tickets),
      Icon: Clock,
      bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40',
      iconBg: 'bg-violet-600',
      valueColor: 'text-violet-700 dark:text-violet-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 pb-0 flex-shrink-0">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`border rounded-2xl p-4 ${s.bg}`}
        >
          <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-3 shadow-sm`}>
            <s.Icon size={16} weight="fill" className="text-white" />
          </div>
          <p className={`text-2xl font-black leading-none mb-1 ${s.valueColor}`}>{s.value}</p>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{s.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

// ─── KNOWLEDGE BASE TAB ───────────────────────────────────────────────────────

function KnowledgeBaseTab({
  faqs,
  setFaqs,
}: {
  faqs: FAQEntry[]
  setFaqs: (f: FAQEntry[]) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  function openAdd() {
    setEditId(null)
    setQuestion('')
    setAnswer('')
    setShowForm(true)
  }

  function openEdit(faq: FAQEntry) {
    setEditId(faq.id)
    setQuestion(faq.question)
    setAnswer(faq.answer)
    setShowForm(true)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return
    if (editId) {
      setFaqs(faqs.map(f =>
        f.id === editId ? { ...f, question: question.trim(), answer: answer.trim() } : f
      ))
    } else {
      setFaqs([...faqs, { id: `faq${Date.now()}`, question: question.trim(), answer: answer.trim() }])
    }
    setShowForm(false)
    setEditId(null)
    setQuestion('')
    setAnswer('')
  }

  function handleCancel() {
    setShowForm(false)
    setEditId(null)
    setQuestion('')
    setAnswer('')
  }

  function handleDelete(id: string) {
    setFaqs(faqs.filter(f => f.id !== id))
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Knowledge Base</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500">
            {faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} weight="bold" />
          Add FAQ
        </button>
      </div>

      {/* Inline add/edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSave}
            className="bg-white dark:bg-neutral-900 border border-violet-200 dark:border-violet-800/60 rounded-2xl p-5 space-y-3 shadow-sm"
          >
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              {editId ? 'Edit FAQ' : 'New FAQ'}
            </h4>

            <div>
              <label htmlFor="faq-question" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 block mb-1.5">
                Question
              </label>
              <textarea
                id="faq-question"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={2}
                placeholder="e.g. How do I join my Zoom class?"
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div>
              <label htmlFor="faq-answer" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 block mb-1.5">
                Answer
              </label>
              <textarea
                id="faq-answer"
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                rows={3}
                placeholder="Write a clear, helpful answer..."
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors"
              >
                Save FAQ
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* FAQ list / empty state */}
      {faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={40} className="mb-4 text-slate-300 dark:text-neutral-700" />
          <p className="font-bold text-slate-600 dark:text-neutral-400">No FAQs yet</p>
          <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">
            Add your first entry to help students find answers.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 flex gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">{faq.question}</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">{faq.answer}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0 pt-0.5">
                <button
                  onClick={() => openEdit(faq)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                  title="Edit"
                >
                  <PencilSimple size={15} />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Delete"
                >
                  <Trash size={15} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function AdminSupport({ store: _store }: { store: AdminStore }) {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_support_tickets') || 'null') ?? INITIAL_SUPPORT_TICKETS }
    catch { return INITIAL_SUPPORT_TICKETS }
  })
  const [faqs, setFaqs] = useState<FAQEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_faqs') || 'null') ?? INITIAL_FAQS }
    catch { return INITIAL_FAQS }
  })
  const [activeTab, setActiveTab] = useState<'tickets' | 'kb'>('tickets')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('admin_support_tickets', JSON.stringify(tickets))
  }, [tickets])

  useEffect(() => {
    localStorage.setItem('admin_faqs', JSON.stringify(faqs))
  }, [faqs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTicket?.id, activeTicket?.messages.length])

  const filteredTickets = tickets
    .filter(ticket => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        ticket.studentName.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.courseName.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus
      const matchesPriority = filterPriority === 'All' || ticket.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!messageInput.trim() || !activeTicket) return
    const newMessage: SupportMessage = {
      id: `msg${Date.now()}`,
      sender: 'admin',
      content: messageInput.trim(),
      timestamp: new Date().toISOString(),
    }
    setTickets(prev =>
      prev.map(t =>
        t.id === activeTicket.id
          ? { ...t, messages: [...t.messages, newMessage], lastMessageAt: newMessage.timestamp }
          : t
      )
    )
    setActiveTicket(prev =>
      prev
        ? { ...prev, messages: [...prev.messages, newMessage], lastMessageAt: newMessage.timestamp }
        : null
    )
    setMessageInput('')
  }

  function handleUpdateStatus(ticketId: string, newStatus: SupportTicket['status']) {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
    setActiveTicket(prev => (prev?.id === ticketId ? { ...prev, status: newStatus } : prev))
  }

  function handleUpdatePriority(ticketId: string, newPriority: SupportTicket['priority']) {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority: newPriority } : t))
    setActiveTicket(prev => (prev?.id === ticketId ? { ...prev, priority: newPriority } : prev))
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-neutral-950 overflow-hidden">

      {/* Stats bar */}
      <SupportStats tickets={tickets} />

      {/* Tab bar */}
      <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
        <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
          {(['tickets', 'kb'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
              }`}
            >
              {tab === 'tickets' ? 'Tickets' : 'Knowledge Base'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'tickets' ? (
            <motion.div
              key="tickets"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex h-full"
            >
              {/* ── Left: Ticket list ── */}
              <div
                className={`
                  fixed lg:static inset-y-0 left-0 z-50
                  w-80 lg:w-96 bg-white dark:bg-neutral-900
                  border-r border-slate-100 dark:border-neutral-800
                  flex flex-col overflow-hidden transition-transform duration-300
                  ${activeTicket ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
                `}
              >
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">Support Tickets</h3>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">{filteredTickets.length} shown</span>
                </div>

                {/* Search + filters */}
                <div className="p-3 border-b border-slate-100 dark:border-neutral-800 space-y-2 flex-shrink-0">
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search tickets..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500"
                    >
                      <option value="All">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select
                      value={filterPriority}
                      onChange={e => setFilterPriority(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500"
                    >
                      <option value="All">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                {/* Ticket cards */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800">
                  {filteredTickets.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-400 dark:text-neutral-500">No tickets found.</p>
                  ) : (
                    filteredTickets.map(ticket => (
                      <button
                        key={ticket.id}
                        onClick={() => setActiveTicket(ticket)}
                        className={`w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/50 ${
                          activeTicket?.id === ticket.id
                            ? 'bg-violet-50 dark:bg-violet-900/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {ticket.studentAvatar}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight">{ticket.studentName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">{ticket.courseName}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_COLORS[ticket.status]}`}>
                              {ticket.status}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${PRIORITY_COLORS[ticket.priority]}`}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300 line-clamp-1 mb-1">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 line-clamp-1">
                          {ticket.messages.at(-1)?.content}
                        </p>
                        <p className="text-[10px] text-slate-300 dark:text-neutral-600 mt-1.5 text-right">
                          {new Date(ticket.lastMessageAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Right: Conversation pane ── */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900">
                <AnimatePresence mode="wait">
                  {activeTicket ? (
                    <motion.div
                      key={activeTicket.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col h-full"
                    >
                      {/* Conversation header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex-shrink-0">
                        <button
                          onClick={() => setActiveTicket(null)}
                          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
                        >
                          <ArrowLeft size={17} weight="bold" />
                        </button>
                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          {activeTicket.studentAvatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm truncate leading-tight">
                            {activeTicket.studentName}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{activeTicket.subject}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <select
                            value={activeTicket.status}
                            onChange={e => handleUpdateStatus(activeTicket.id, e.target.value as SupportTicket['status'])}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase outline-none cursor-pointer border-0 ${STATUS_COLORS[activeTicket.status]}`}
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                          </select>
                          <select
                            value={activeTicket.priority}
                            onChange={e => handleUpdatePriority(activeTicket.id, e.target.value as SupportTicket['priority'])}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase outline-none cursor-pointer border-0 ${PRIORITY_COLORS[activeTicket.priority]}`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>

                      {/* Message thread */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-neutral-950">
                        {activeTicket.messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-[80%]">
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                                  msg.sender === 'admin'
                                    ? 'bg-violet-600 text-white rounded-tr-sm'
                                    : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 rounded-tl-sm'
                                }`}
                              >
                                {msg.content}
                              </div>
                              <div
                                className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-neutral-500 ${
                                  msg.sender === 'admin' ? 'justify-end' : 'justify-start'
                                }`}
                              >
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.sender === 'admin' && (
                                  <Check size={11} weight="bold" className="text-violet-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Reply input */}
                      <div className="p-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
                        <form
                          onSubmit={handleSendMessage}
                          className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700 focus-within:border-violet-400 dark:focus-within:border-violet-600 transition-colors"
                        >
                          <input
                            type="text"
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none px-3 placeholder-slate-400 dark:placeholder-neutral-500"
                          />
                          <button
                            type="submit"
                            disabled={!messageInput.trim()}
                            className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 shadow-sm"
                          >
                            <PaperPlaneRight size={15} weight="fill" />
                          </button>
                        </form>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-center text-center p-8"
                    >
                      <div>
                        <ChatCircleDots
                          size={44}
                          className="mx-auto mb-4 text-slate-300 dark:text-neutral-700"
                        />
                        <p className="font-bold text-slate-700 dark:text-neutral-300 mb-1">
                          No ticket selected
                        </p>
                        <p className="text-sm text-slate-400 dark:text-neutral-500">
                          Choose a support ticket from the list to view the conversation.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="kb"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full overflow-y-auto"
            >
              <KnowledgeBaseTab faqs={faqs} setFaqs={setFaqs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
