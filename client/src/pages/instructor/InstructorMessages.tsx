import { useState, useRef, useEffect } from 'react'
import { messagesService } from '../../services/messages.service'
import { MagnifyingGlass, PaperPlaneRight, DotsThreeVertical, CaretLeft, CheckCircle } from '@phosphor-icons/react'
import type { Conversation } from '../../types/api'

type Message = {
  id: string
  senderId: string
  text: string
  time: string
  isRead: boolean
}

type Chat = {
  id: string
  studentName: string
  courseName: string
  avatar: string
  isOnline: boolean
  unreadCount: number
  messages: Message[]
}

const FALLBACK_CHATS: Chat[] = [
  {
    id: 's1',
    studentName: 'Ali Khan',
    courseName: 'IELTS Academic Prep',
    avatar: 'A',
    isOnline: true,
    unreadCount: 2,
    messages: [
      { id: 'm1', senderId: 's1', text: 'Hello ma\'am, I have a question about yesterday\'s assignment.', time: '09:30 AM', isRead: false },
      { id: 'm2', senderId: 's1', text: 'Can we use informal words in task 2?', time: '09:32 AM', isRead: false },
    ]
  },
  {
    id: 's2',
    studentName: 'Ayesha Tariq',
    courseName: 'Business English Basics',
    avatar: 'AT',
    isOnline: false,
    unreadCount: 0,
    messages: [
      { id: 'm3', senderId: 'instructor', text: 'Great presentation today, Ayesha!', time: 'Yesterday', isRead: true },
      { id: 'm4', senderId: 's2', text: 'Thank you so much! Your feedback really helped.', time: 'Yesterday', isRead: true },
    ]
  },
  {
    id: 's3',
    studentName: 'Bilal Ahmed',
    courseName: 'Advanced Grammar',
    avatar: 'B',
    isOnline: true,
    unreadCount: 1,
    messages: [
      { id: 'm5', senderId: 's3', text: 'I am running 10 mins late for the live class today.', time: '10:15 AM', isRead: false },
    ]
  },
  {
    id: 's4',
    studentName: 'Fatima Noor',
    courseName: 'IELTS Academic Prep',
    avatar: 'F',
    isOnline: false,
    unreadCount: 0,
    messages: [
      { id: 'm6', senderId: 's4', text: 'Understood, I will submit the essay by tonight.', time: 'Mon', isRead: true },
    ]
  }
]

function conversationToChat(conv: Conversation): Chat {
  return {
    id: conv.user._id,
    studentName: conv.user.name,
    courseName: conv.user.role === 'admin' ? 'Support' : 'Student',
    avatar: conv.user.name.charAt(0).toUpperCase(),
    isOnline: false,
    unreadCount: conv.unreadCount,
    messages: conv.lastMessage
      ? [{
          id: 'last',
          senderId: conv.user._id,
          text: conv.lastMessage.content,
          time: conv.lastMessage.createdAt
            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '',
          isRead: conv.lastMessage.isRead,
        }]
      : [],
  }
}

export default function InstructorMessages() {
  const [chats, setChats] = useState<Chat[]>(FALLBACK_CHATS)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch conversations on mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await messagesService.getConversations()
        if (res.success && res.data.length > 0) {
          setChats(res.data.map(conversationToChat))
        }
      } catch {
        // fallback to mock data
      }
    }
    fetchConversations()
  }, [])

  // Fetch full messages when a conversation is selected
  useEffect(() => {
    if (!selectedChatId) return
    const fetchMessages = async () => {
      try {
        const res = await messagesService.getConversation(selectedChatId)
        if (res.success && res.data.length > 0) {
          setChats(prev => prev.map(chat => {
            if (chat.id === selectedChatId) {
              return {
                ...chat,
                messages: res.data.map((m: any) => ({
                  id: m._id,
                  senderId: m.sender?._id === selectedChatId ? selectedChatId : 'instructor',
                  text: m.content,
                  time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isRead: m.isRead,
                })),
                unreadCount: 0,
              }
            }
            return chat
          }))
        }
      } catch {
        // fallback to existing messages
      }
    }
    fetchMessages()
  }, [selectedChatId])

  const selectedChat = chats.find(c => c.id === selectedChatId)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
  }, [chats])

  const filteredChats = chats.filter(chat =>
    chat.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.courseName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !selectedChatId) return

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'instructor',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    }

    // Try API first
    try {
      await messagesService.sendMessage({ receiverId: selectedChatId, content: inputMessage })
    } catch {
      // Fallback: just update locally
    }

    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === selectedChatId) {
        return { ...chat, messages: [...chat.messages, newMessage] }
      }
      return chat
    }))

    setInputMessage('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Student Messages</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Communicate directly with your enrolled students.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Pane: Chat List */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden flex-shrink-0 transition-transform ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="relative group">
              <MagnifyingGlass size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" weight="bold" />
              <input 
                type="text" 
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">No conversations found.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-neutral-800/50">
                {filteredChats.map(chat => {
                  const lastMessage = chat.messages[chat.messages.length - 1]
                  const isSelected = selectedChatId === chat.id
                  return (
                    <button 
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full text-left p-4 flex items-center gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800/50 ${isSelected ? 'bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-lg">
                          {chat.avatar}
                        </div>
                        {chat.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className={`text-sm truncate font-bold ${chat.unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>{chat.studentName}</h3>
                          <span className={`text-[10px] whitespace-nowrap ml-2 ${chat.unreadCount > 0 ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-400'}`}>
                            {lastMessage?.time}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate mb-1">{chat.courseName}</p>
                        <div className="flex justify-between items-center gap-2">
                          <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'font-bold text-slate-800 dark:text-neutral-200' : 'text-slate-500 dark:text-neutral-400'}`}>
                            {lastMessage?.senderId === 'instructor' ? 'You: ' : ''}{lastMessage?.text}
                          </p>
                          {chat.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane: Chat Window */}
        <div className={`flex-1 flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedChatId(null)}
                    className="md:hidden w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-300"
                  >
                    <CaretLeft size={16} weight="bold" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black">
                      {selectedChat.avatar}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">{selectedChat.studentName}</h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">{selectedChat.courseName}</p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 flex items-center justify-center text-slate-500 transition-colors">
                  <DotsThreeVertical size={20} weight="bold" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-neutral-900/30">
                {selectedChat.messages.map(msg => {
                  const isMe = msg.senderId === 'instructor'
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center flex-shrink-0 mb-1 font-bold text-xs">
                            {selectedChat.avatar}
                          </div>
                        )}
                        <div className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-violet-600 text-white rounded-br-sm shadow-md shadow-violet-600/20' : 'bg-white dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 text-slate-700 dark:text-neutral-200 rounded-bl-sm shadow-sm'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 mt-1.5 ${isMe ? 'pr-2' : 'pl-10'}`}>
                        <span className="text-[10px] font-bold text-slate-400">
                          {msg.time}
                        </span>
                        {isMe && (
                          <CheckCircle size={12} weight={msg.isRead ? "fill" : "regular"} className={msg.isRead ? "text-violet-500" : "text-slate-400"} />
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <input 
                    type="text" 
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder="Write your message..."
                    className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-violet-600/20 flex-shrink-0"
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-neutral-600 p-6 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <PaperPlaneRight size={32} weight="duotone" className="text-slate-300 dark:text-neutral-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-neutral-300 mb-2">Your Messages</h3>
              <p className="text-sm max-w-xs">Select a conversation from the sidebar to view messages or start a new chat.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
