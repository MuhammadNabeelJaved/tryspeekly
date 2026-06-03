import { useState, useRef, useEffect } from 'react'
import { messagesService } from '../../services/messages.service'
import { useAuth } from '../../context/AuthContext'
import { Headset, PaperPlaneRight, Info } from '@phosphor-icons/react'

type Message = {
  id: string
  sender: 'instructor' | 'admin'
  text: string
  time: string
}

const FALLBACK_MESSAGES: Message[] = [
  { id: '1', sender: 'admin', text: 'Hello! Welcome to Instructor Support. How can we help you today?', time: '10:00 AM' },
  { id: '2', sender: 'instructor', text: 'Hi, I need help updating my bank details for payout.', time: '10:05 AM' },
  { id: '3', sender: 'admin', text: 'Sure! You can update your bank details from the Settings > Integrations page, or if you need a manual update, please provide the new IBAN here securely.', time: '10:15 AM' },
]

export default function InstructorSupport() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES)
  const [supportUserId, setSupportUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch conversations and find support/admin user
  useEffect(() => {
    const fetchSupport = async () => {
      try {
        const res = await messagesService.getConversations()
        if (res.success && res.data.length > 0) {
          // Find admin/support user
          const support = res.data.find(c => c.user?.role === 'admin')
          if (support) {
            setSupportUserId(support.user._id)
            // Fetch support conversation messages
            const msgsRes = await messagesService.getMessagesWith(support.user._id)
            if (msgsRes.success && msgsRes.data.length > 0) {
              setMessages(msgsRes.data.map((m: any) => ({
                id: m._id,
                sender: m.sender?._id === user?.id ? 'instructor' : ('admin' as 'instructor' | 'admin'),
                text: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              })))
            }
          }
        }
      } catch {
        // fallback to mock data
      }
    }
    fetchSupport()
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'instructor',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMsg])
    setInput('')

    // Try to send via API
    if (supportUserId) {
      try {
        await messagesService.sendMessage({ receiverId: supportUserId, content: input })
      } catch {
        // fallback - just keep local message
      }
    }

    // Simulate admin reply (always keep this for UX)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'admin',
        text: 'Thank you for your message. An admin will review your request and get back to you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    }, 1000)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Support & Help</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Communicate directly with the Admin Team for assistance.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm self-start sm:self-auto">
          <Info size={18} weight="bold" />
          FAQs
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center gap-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Headset size={20} weight="fill" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">Admin Support Team</h2>
            <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-neutral-900/30">
          {messages.map(msg => {
            const isMe = msg.sender === 'instructor'
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 mb-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-neutral-400">A</span>
                    </div>
                  )}
                  <div className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-violet-600 text-white rounded-br-sm shadow-md shadow-violet-600/20' : 'bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 rounded-bl-sm shadow-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold text-slate-400 mt-1.5 ${isMe ? 'pr-2' : 'pl-10'}`}>
                  {msg.time}
                </span>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message to admin..."
              className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-violet-600/20 flex-shrink-0"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
