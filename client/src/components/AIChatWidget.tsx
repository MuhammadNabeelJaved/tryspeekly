import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PaperPlaneRight, Sparkle, Trash, CaretRight } from '@phosphor-icons/react'
import { axiosClient } from '@/lib/axiosClient'
import { useAuth } from '@/context/AuthContext'
import { config } from '@/config/env'
import type { User } from '@/types/api'

const ChatMessage = lazy(() => import('@/components/ChatMessage'))

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'ep_chat_history'
const MAX_STORED = 50

// ─── Role-specific config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    badge: 'Admin',
    badgeClass: 'bg-amber-400/20 text-amber-200 border border-amber-400/30',
    subtitle: 'Full platform access',
    starters: [
      'Platform overview stats',
      'Show pending payments',
      'Total revenue earned',
      'How many students enrolled?',
    ],
  },
  teacher: {
    badge: 'Instructor',
    badgeClass: 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30',
    subtitle: 'Your instructor dashboard',
    starters: [
      'Show my courses',
      'How many students do I have?',
      'My certificates issued',
      'My pending approvals',
    ],
  },
  student: {
    badge: 'Student',
    badgeClass: 'bg-sky-400/20 text-sky-200 border border-sky-400/30',
    subtitle: 'Your personal assistant',
    starters: [
      'My enrolled courses',
      "What's my progress?",
      'Do I have any certificates?',
      'Browse all courses',
    ],
  },
  team_member: {
    badge: 'Team',
    badgeClass: 'bg-violet-400/20 text-violet-200 border border-violet-400/30',
    subtitle: 'Team member access',
    starters: [
      'Platform overview',
      'Pending items',
      'Browse courses',
      'Contact support',
    ],
  },
}

const GUEST_STARTERS = [
  'What courses do you offer?',
  'How do I enrol?',
  'Do you offer financial aid?',
]

const getWelcome = (user: User | null): Message => {
  if (!user) {
    return {
      role: 'assistant',
      content:
        "Hi! I'm the **TrySpeekly AI Assistant** 👋\n\nAsk me anything about our courses, enrollment, or learning English!",
    }
  }
  const first = user.name?.split(' ')[0] || 'there'
  const map: Record<string, string> = {
    admin: `Hi **${first}**! 👋 I have full access to your platform data.\n\nAsk me about students, revenue, courses, pending payments, or anything else.`,
    teacher: `Hi **${first}**! 👋 I'm your TrySpeekly assistant.\n\nAsk me about your courses, enrolled students, certificates, or your teaching dashboard.`,
    student: `Hi **${first}**! 👋 I can help with your enrolled courses, progress, certificates, and payments.\n\nWhat would you like to know?`,
    team_member: `Hi **${first}**! 👋 Ask me about the platform, courses, or anything within your permitted sections.`,
  }
  return { role: 'assistant', content: map[user.role] ?? map.student }
}

// ─── Component ────────────────────────────────────────────────────────────────────
export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [getWelcome(null)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const loadedRef = useRef(false)
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const cfg = user ? (ROLE_CONFIG[user.role as keyof typeof ROLE_CONFIG] ?? null) : null
  const starters = cfg?.starters ?? GUEST_STARTERS

  // Reset welcome message on login / logout
  useEffect(() => {
    loadedRef.current = false
    setMessages([getWelcome(user ?? null)])
    setInput('')
  }, [user?._id])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200)
  }, [open])

  // Restore saved conversation the first time the widget opens
  useEffect(() => {
    if (!open || loadedRef.current) return
    loadedRef.current = true
    ;(async () => {
      try {
        if (isAuthenticated) {
          const res = await axiosClient.get<{ data: { messages: Message[] } }>('/ai-chat/session')
          const hist = res.data?.data?.messages ?? []
          if (hist.length) setMessages([getWelcome(user ?? null), ...hist])
        } else {
          const raw = localStorage.getItem(STORAGE_KEY)
          const hist: Message[] = raw ? (JSON.parse(raw) as Message[]) : []
          if (Array.isArray(hist) && hist.length) setMessages([getWelcome(null), ...hist])
        }
      } catch {
        /* start fresh on error */
      }
    })()
  }, [open, isAuthenticated])

  // Persist guest conversations in localStorage
  useEffect(() => {
    if (isAuthenticated) return
    const hist = messages.slice(1)
    if (hist.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(hist.slice(-MAX_STORED)))
  }, [messages, isAuthenticated])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const send = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await axiosClient.post<{ success: boolean; reply: string }>('/ai-chat', {
        messages: next.slice(1), // exclude welcome message
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I'm having trouble connecting. Please try again or contact us at ${config.contactEmail}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clearChat = async () => {
    try {
      if (isAuthenticated) await axiosClient.delete('/ai-chat/session')
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    loadedRef.current = false
    setMessages([getWelcome(user ?? null)])
    setInput('')
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?'
  const userPhoto = user?.photo || user?.profileImage

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-[7rem] right-4 sm:right-6 z-[9990] w-[calc(100vw-2rem)] sm:w-[400px] flex flex-col rounded-2xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-[0_24px_60px_-10px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden"
            style={{ maxHeight: 'min(580px, calc(100vh - 120px))' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Sparkle size={18} weight="fill" className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-bold text-sm leading-none">TrySpeekly AI</p>
                  {cfg && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none ${cfg.badgeClass}`}>
                      {cfg.badge}
                    </span>
                  )}
                </div>
                <p className="text-violet-200 text-[11px] truncate">
                  {cfg?.subtitle ?? 'Usually replies instantly'}
                </p>
              </div>
              <button
                onClick={clearChat}
                title="Clear chat history"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <Trash size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 mb-0.5">
                      <Sparkle size={13} weight="fill" className="text-violet-600 dark:text-violet-400" />
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-2xl rounded-br-sm shadow-sm'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 rounded-2xl rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <Suspense fallback={<span>{msg.content}</span>}>
                        <ChatMessage content={msg.content} onNavigate={go} />
                      </Suspense>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mb-0.5 overflow-hidden text-white text-xs font-bold">
                      {userPhoto ? (
                        <img src={userPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        userInitial
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Starter questions — shown only on fresh chat */}
              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1 pl-9">
                  {starters.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors font-medium"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                    <Sparkle size={13} weight="fill" className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="bg-slate-100 dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-neutral-900">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                disabled={loading}
                className="flex-1 text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-60"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-sm"
              >
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating trigger button ────────────────────────────────────────────── */}
      <div className="fixed bottom-[4.5rem] md:bottom-20 right-4 sm:right-6 z-[9991] flex items-center gap-1.5">
        <AnimatePresence>
          {!open && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-0.5"
            >
              {[0, 1].map(i => (
                <motion.div
                  key={i}
                  animate={{ x: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25, ease: 'easeInOut' }}
                >
                  <CaretRight size={14} weight="bold" className="text-violet-500 dark:text-violet-400" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full shadow-[0_8px_30px_rgba(124,58,237,0.5)] flex items-center justify-center text-white"
          aria-label="Open AI chat"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={22} weight="bold" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Sparkle size={22} weight="fill" />
              </motion.span>
            )}
          </AnimatePresence>

          {!open && <span className="absolute inset-0 rounded-full animate-ping bg-violet-500 opacity-20" />}
          {!open && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-neutral-900" />
          )}
        </motion.button>
      </div>
    </>
  )
}
