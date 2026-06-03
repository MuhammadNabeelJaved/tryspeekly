import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, PaperPlaneRight, Sparkle, ArrowsCounterClockwise, CaretRight } from '@phosphor-icons/react'
import { axiosClient } from '@/lib/axiosClient'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: Message = {
  role: 'assistant',
  content: "Hi! I'm the EnglishPro AI Assistant 👋 Ask me anything about our courses, enrollment, or learning English!",
}

const STARTERS = [
  'What courses do you offer?',
  'How do I enrol?',
  'Do you offer financial aid?',
]

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
        messages: next.filter(m => m.role !== 'assistant' || next.indexOf(m) > 0),
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again or contact us at hello@englishlms.com" }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const reset = () => setMessages([WELCOME])

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[7rem] right-4 sm:right-6 z-[9990] w-[340px] sm:w-[380px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 flex flex-col overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 100px)', height: '520px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkle size={16} weight="fill" className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">EnglishPro Assistant</p>
                <p className="text-violet-200 text-[11px]">Powered by AI · Usually replies instantly</p>
              </div>
              <button
                onClick={reset}
                title="New conversation"
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <ArrowsCounterClockwise size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                      <Sparkle size={12} weight="fill" className="text-violet-600 dark:text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {messages.length === 1 && !loading && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkle size={12} weight="fill" className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="bg-slate-100 dark:bg-neutral-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-neutral-500"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-neutral-800 flex items-center gap-2">
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
                className="w-9 h-9 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors flex-shrink-0"
              >
                <PaperPlaneRight size={16} weight="fill" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button wrapper */}
      <div className="fixed bottom-[4.5rem] md:bottom-20 right-4 sm:right-6 z-[9991] flex items-center gap-2">

        {/* Left arrow indicators */}
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

        {/* Chat button */}
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full shadow-[0_8px_30px_rgba(124,58,237,0.45)] flex items-center justify-center text-white"
          aria-label="Open AI chat"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X size={22} weight="bold" />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Sparkle size={22} weight="fill" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Pulse ring */}
          {!open && (
            <span className="absolute inset-0 rounded-full animate-ping bg-violet-500 opacity-20" />
          )}

          {/* Online badge — bottom-right corner */}
          {!open && (
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-neutral-900" />
          )}
        </motion.button>
      </div>
    </>
  )
}
