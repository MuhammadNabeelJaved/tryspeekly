import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatCircleDots, MagnifyingGlass, ArrowLeft, PaperPlaneRight, Check,
  ClipboardText, Clock, CheckCircle, Warning, PencilSimple, Trash, Plus,
  BookOpen, SpinnerGap,
} from '@phosphor-icons/react'
import { supportService } from '@/services/support.service'
import type { SupportTicket } from '@/types/api'

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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function SupportStats({ tickets }: { tickets: SupportTicket[] }) {
  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, Icon: ClipboardText, bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40', iconBg: 'bg-emerald-500', valueColor: 'text-emerald-700 dark:text-emerald-400' },
    { label: 'Pending', value: tickets.filter(t => t.status === 'pending').length, Icon: Warning, bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40', iconBg: 'bg-amber-500', valueColor: 'text-amber-700 dark:text-amber-400' },
    { label: 'Closed', value: tickets.filter(t => t.status === 'closed').length, Icon: CheckCircle, bg: 'bg-slate-50 dark:bg-neutral-800/60 border-slate-100 dark:border-neutral-700', iconBg: 'bg-slate-500 dark:bg-neutral-600', valueColor: 'text-slate-700 dark:text-neutral-300' },
    { label: 'Total', value: tickets.length, Icon: ClipboardText, bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40', iconBg: 'bg-violet-600', valueColor: 'text-violet-700 dark:text-violet-400' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 pb-0 flex-shrink-0">
      {stats.map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className={`border rounded-2xl p-4 ${s.bg}`}>
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

// ─── FAQ Types ────────────────────────────────────────────────────────────────

interface FAQEntry { id: string; question: string; answer: string }

function KnowledgeBaseTab({ faqs, setFaqs }: { faqs: FAQEntry[]; setFaqs: (f: FAQEntry[]) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')

  function openAdd() { setEditId(null); setQuestion(''); setAnswer(''); setShowForm(true) }
  function openEdit(faq: FAQEntry) { setEditId(faq.id); setQuestion(faq.question); setAnswer(faq.answer); setShowForm(true) }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !answer.trim()) return
    if (editId) {
      setFaqs(faqs.map(f => f.id === editId ? { ...f, question: question.trim(), answer: answer.trim() } : f))
    } else {
      setFaqs([...faqs, { id: `faq${Date.now()}`, question: question.trim(), answer: answer.trim() }])
    }
    setShowForm(false); setEditId(null); setQuestion(''); setAnswer('')
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Knowledge Base</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500">{faqs.length} FAQ{faqs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          <Plus size={15} weight="bold" /> Add FAQ
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
            onSubmit={handleSave}
            className="bg-white dark:bg-neutral-900 border border-violet-200 dark:border-violet-800/60 rounded-2xl p-5 space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{editId ? 'Edit FAQ' : 'New FAQ'}</h4>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} required
              placeholder="Question…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 resize-none" />
            <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={3} required
              placeholder="Answer…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 resize-none" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors">
                Save FAQ
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={40} className="mb-4 text-slate-300 dark:text-neutral-700" />
          <p className="font-bold text-slate-600 dark:text-neutral-400">No FAQs yet</p>
          <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">Add your first entry to help students find answers.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div key={faq.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 flex gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">{faq.question}</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">{faq.answer}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0 pt-0.5">
                <button onClick={() => openEdit(faq)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors">
                  <PencilSimple size={15} />
                </button>
                <button onClick={() => setFaqs(faqs.filter(f => f.id !== faq.id))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [faqs, setFaqs] = useState<FAQEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_faqs') || 'null') ?? [] }
    catch { return [] }
  })
  const [activeTab, setActiveTab] = useState<'tickets' | 'kb'>('tickets')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem('admin_faqs', JSON.stringify(faqs))
  }, [faqs])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeTicket?._id, activeTicket?.messages.length])

  const fetchTickets = useCallback(() => {
    setLoading(true)
    supportService.getAllTickets({ limit: 100 })
      .then(res => {
        setTickets(res.data)
        setActiveTicket(prev => prev ? (res.data.find(t => t._id === prev._id) ?? null) : null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const filteredTickets = tickets
    .filter(ticket => {
      const q = search.toLowerCase()
      const matchesSearch = !q || ticket.student.name.toLowerCase().includes(q) || ticket.subject.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'All' || ticket.status === filterStatus
      const matchesPriority = filterPriority === 'All' || ticket.priority === filterPriority
      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !activeTicket) return
    setSending(true)
    try {
      await supportService.replyToTicket(activeTicket._id, messageInput.trim())
      setMessageInput('')
      fetchTickets()
    } catch {
      // silent fail
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: SupportTicket['status']) => {
    try {
      await supportService.updateTicketStatus(ticketId, newStatus)
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: newStatus } : t))
      setActiveTicket(prev => prev?._id === ticketId ? { ...prev, status: newStatus } : prev)
    } catch {
      // silent fail
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-neutral-950 overflow-hidden">
      <SupportStats tickets={tickets} />

      <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
        <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 w-fit">
          {(['tickets', 'kb'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}>
              {tab === 'tickets' ? 'Tickets' : 'Knowledge Base'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'tickets' ? (
            <motion.div key="tickets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex h-full">
              {/* ── Ticket list ── */}
              <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 lg:w-96 bg-white dark:bg-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col overflow-hidden transition-transform duration-300 ${activeTicket ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}`}>
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">Support Tickets</h3>
                  <span className="text-[11px] text-slate-400 dark:text-neutral-500">{filteredTickets.length} shown</span>
                </div>

                <div className="p-3 border-b border-slate-100 dark:border-neutral-800 space-y-2 flex-shrink-0">
                  <div className="relative">
                    <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  <div className="flex gap-2">
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                      <option value="All">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="pending">Pending</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                      <option value="All">All Priorities</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="p-4 animate-pulse">
                        <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-3/4 mb-2" />
                        <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded w-1/2" />
                      </div>
                    ))
                  ) : filteredTickets.length === 0 ? (
                    <p className="p-6 text-center text-sm text-slate-400 dark:text-neutral-500">No tickets found.</p>
                  ) : (
                    filteredTickets.map(ticket => (
                      <button key={ticket._id} onClick={() => setActiveTicket(ticket)}
                        className={`w-full text-left p-4 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/50 ${activeTicket?._id === ticket._id ? 'bg-violet-50 dark:bg-violet-900/20' : ''}`}>
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                            {ticket.student.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight">{ticket.student.name}</p>
                            <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">{ticket.course?.title ?? 'General'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${STATUS_COLORS[ticket.status]}`}>{ticket.status}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${PRIORITY_COLORS[ticket.priority]}`}>{ticket.priority}</span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300 line-clamp-1 mb-1">{ticket.subject}</p>
                        <p className="text-xs text-slate-400 dark:text-neutral-500 line-clamp-1">{ticket.messages.at(-1)?.content}</p>
                        <p className="text-[10px] text-slate-300 dark:text-neutral-600 mt-1.5 text-right">
                          {new Date(ticket.lastMessageAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Conversation pane ── */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900">
                <AnimatePresence mode="wait">
                  {activeTicket ? (
                    <motion.div key={activeTicket._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="flex flex-col h-full">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex-shrink-0">
                        <button onClick={() => setActiveTicket(null)}
                          className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors flex-shrink-0">
                          <ArrowLeft size={17} weight="bold" />
                        </button>
                        <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                          {activeTicket.student.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white text-sm truncate leading-tight">{activeTicket.student.name}</p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{activeTicket.subject}</p>
                        </div>
                        <select value={activeTicket.status}
                          onChange={e => handleUpdateStatus(activeTicket._id, e.target.value as SupportTicket['status'])}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase outline-none cursor-pointer border-0 ${STATUS_COLORS[activeTicket.status]}`}>
                          <option value="open">Open</option>
                          <option value="pending">Pending</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-neutral-950">
                        {activeTicket.messages.map(msg => (
                          <div key={msg._id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[80%]">
                              <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.sender === 'admin' ? 'bg-violet-600 text-white rounded-tr-sm' : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 rounded-tl-sm'}`}>
                                {msg.content}
                              </div>
                              <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-neutral-500 ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.sender === 'admin' && <Check size={11} weight="bold" className="text-violet-500" />}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      {activeTicket.status !== 'closed' && (
                        <div className="p-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
                          <form onSubmit={handleSendMessage}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700 focus-within:border-violet-400 dark:focus-within:border-violet-600 transition-colors">
                            <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)}
                              placeholder="Type a reply..."
                              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none px-3 placeholder-slate-400 dark:placeholder-neutral-500" />
                            <button type="submit" disabled={!messageInput.trim() || sending}
                              className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
                              {sending ? <SpinnerGap size={15} className="animate-spin" /> : <PaperPlaneRight size={15} weight="fill" />}
                            </button>
                          </form>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center text-center p-8">
                      <div>
                        <ChatCircleDots size={44} className="mx-auto mb-4 text-slate-300 dark:text-neutral-700" />
                        <p className="font-bold text-slate-700 dark:text-neutral-300 mb-1">No ticket selected</p>
                        <p className="text-sm text-slate-400 dark:text-neutral-500">Choose a support ticket from the list to view the conversation.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div key="kb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full overflow-y-auto">
              <KnowledgeBaseTab faqs={faqs} setFaqs={setFaqs} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
