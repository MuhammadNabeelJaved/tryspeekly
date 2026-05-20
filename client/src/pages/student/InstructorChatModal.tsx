import { useState, useEffect, useRef, useCallback } from 'react'
import { X, PaperPlaneRight, Checks, Check } from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { messagesService } from '@/services/messages.service'
import type { Message } from '@/types/api'
import UserAvatar from '@/components/UserAvatar'

interface Props {
  isOpen: boolean
  onClose: () => void
  instructorId: string
  instructorName: string
  instructorProfileImage?: string
  courseTitle: string
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InstructorChatModal({
  isOpen, onClose, instructorId, instructorName, instructorProfileImage, courseTitle,
}: Props) {
  const { user } = useAuth()
  const { onNewMessage, setActiveConversation, setUnreadMessages } = useSocket()

  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // ── Load history when modal opens ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !instructorId) return

    setActiveConversation(instructorId)
    setMessages([])
    setIsLoadingHistory(true)

    messagesService.getMessagesWith(instructorId, { limit: 50 })
      .then(res => {
        if (res.success) setMessages(res.data)
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingHistory(false)
        setTimeout(() => scrollToBottom('instant'), 50)
      })

    inputRef.current?.focus()

    return () => {
      setActiveConversation(null)
    }
  }, [isOpen, instructorId, setActiveConversation, scrollToBottom])

  // ── Real-time incoming messages ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return

    const unsub = onNewMessage((msg: Message) => {
      const fromInstructor = msg.sender._id === instructorId
      if (!fromInstructor) return

      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      setUnreadMessages(prev => Math.max(0, prev - 1))
      setTimeout(() => scrollToBottom(), 50)
    })

    return unsub
  }, [isOpen, instructorId, onNewMessage, setUnreadMessages, scrollToBottom])

  // ── Scroll on new message ───────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) scrollToBottom()
  }, [messages.length, scrollToBottom])

  // ── Send ────────────────────────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = content.trim()
    if (!text || isSending || !instructorId) return

    setContent('')
    setIsSending(true)

    try {
      const res = await messagesService.sendMessage({ receiverId: instructorId, content: text })
      if (res.success) {
        setMessages(prev => {
          if (prev.some(m => m._id === res.data._id)) return prev
          return [...prev, res.data]
        })
        setTimeout(() => scrollToBottom(), 50)
      }
    } catch {
      setContent(text)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  if (!isOpen) return null

  // ── Group messages by date ──────────────────────────────────────────────────
  const grouped: { label: string; msgs: Message[] }[] = []
  messages.forEach(msg => {
    const label = formatDateLabel(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.label === label) {
      last.msgs.push(msg)
    } else {
      grouped.push({ label, msgs: [msg] })
    }
  })

  const initials = instructorName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="bg-white dark:bg-neutral-900 w-full sm:w-[440px] sm:rounded-3xl rounded-t-3xl h-[85vh] sm:h-[600px] relative z-10 shadow-2xl overflow-hidden flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar src={instructorProfileImage} name={instructorName} size="sm" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{instructorName}</h3>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate max-w-[200px]">{courseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/60 dark:bg-neutral-950">

          {isLoadingHistory ? (
            <div className="flex flex-col gap-3 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`h-10 rounded-2xl animate-pulse bg-slate-200 dark:bg-neutral-800 ${i % 2 === 0 ? 'w-40' : 'w-56'}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-500 text-xl font-black mb-3">
                {initials}
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-neutral-300">{instructorName}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Start the conversation!</p>
            </div>
          ) : (
            grouped.map(({ label, msgs }) => (
              <div key={label}>
                {/* Date divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-800" />
                  <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-800" />
                </div>

                <div className="space-y-2">
                  {msgs.map((msg, i) => {
                    const isMe = msg.sender._id === user?._id || msg.sender._id === (user as any)?.id
                    const isLast = i === msgs.length - 1

                    return (
                      <div key={msg._id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {/* Avatar — only on last of their bubble group */}
                        {!isMe && (
                          <div className="flex-shrink-0 mb-0.5">
                            {isLast ? (
                              <UserAvatar src={instructorProfileImage} name={instructorName} size="xs" />
                            ) : (
                              <div className="w-6 h-6" />
                            )}
                          </div>
                        )}

                        <div className={`max-w-[72%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? 'bg-violet-600 text-white rounded-br-sm shadow-[0_2px_8px_rgba(124,58,237,0.25)]'
                              : 'bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-bl-sm shadow-sm'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-neutral-500 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <span>{formatTime(msg.createdAt)}</span>
                            {isMe && (
                              msg.isRead
                                ? <Checks size={12} weight="bold" className="text-violet-400" />
                                : <Check size={12} weight="bold" className="text-slate-300 dark:text-neutral-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ── */}
        <div className="px-3 py-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 rounded-2xl border border-slate-200 dark:border-neutral-700 pl-4 pr-1.5 py-1.5">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 outline-none"
            />
            <button
              type="submit"
              disabled={!content.trim() || isSending}
              className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
            >
              <PaperPlaneRight size={16} weight="fill" />
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
