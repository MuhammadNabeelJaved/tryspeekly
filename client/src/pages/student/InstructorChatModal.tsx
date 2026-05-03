import React, { useState } from 'react'
import { X, PaperPlaneRight, VideoCamera, Checks, Paperclip } from '@phosphor-icons/react'
import { MOCK_STUDENT } from './studentData'

interface InstructorChatModalProps {
  isOpen: boolean
  onClose: () => void
  instructorName: string
  courseTitle: string
}

export default function InstructorChatModal({ isOpen, onClose, instructorName, courseTitle }: InstructorChatModalProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'instructor',
      text: `Hello ${MOCK_STUDENT.name.split(' ')[0]}! Welcome to ${courseTitle}. If you have any questions about the live classes or assignments, feel free to ask here.`,
      time: '10:00 AM',
      date: 'Today'
    }
  ])

  if (!isOpen) return null

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMsg = {
      id: Date.now(),
      sender: 'student',
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: 'Today'
    }

    setMessages([...messages, newMsg])
    setMessage('')

    // Mock Instructor Reply
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'instructor',
        text: "I've received your message. I'll get back to you shortly after my current live session.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: 'Today'
      }])
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div className="bg-white dark:bg-neutral-900 w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl h-[85vh] sm:h-[600px] relative z-10 shadow-2xl overflow-hidden flex flex-col">
        
        {/* Chat Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold">
                {instructorName.charAt(0)}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{instructorName}</h3>
              <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-semibold">{courseTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-white dark:bg-neutral-800 rounded-full shadow-sm transition-colors">
              <VideoCamera size={16} weight="fill" />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 dark:bg-neutral-950 space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest bg-slate-100 dark:bg-neutral-800 px-2 py-1 rounded-md">Today</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.sender === 'student' ? 'order-2' : 'order-1'}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  msg.sender === 'student' 
                    ? 'bg-violet-600 text-white rounded-tr-sm' 
                    : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 rounded-tl-sm'
                }`}>
                  <p>{msg.text}</p>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 dark:text-neutral-500 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                  {msg.time}
                  {msg.sender === 'student' && <Checks size={14} weight="bold" className="text-violet-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
          <form onSubmit={handleSend} className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 p-1.5 rounded-2xl border border-slate-200 dark:border-neutral-700">
            <button type="button" className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none px-2"
            />
            <button 
              type="submit" 
              disabled={!message.trim()}
              className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              <PaperPlaneRight size={18} weight="fill" />
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}