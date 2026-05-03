import React, { useState } from 'react'
import { ChatCircleDots, PaperPlaneRight, EnvelopeSimple } from '@phosphor-icons/react'
import { MOCK_STUDENT } from './studentData'

export default function StudentSupport() {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSent(true)
    setMessage('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Support</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Need help? Send us a message and we'll get back to you shortly.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <ChatCircleDots size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight">Student Success Team</h3>
              <p className="text-xs text-green-500 font-semibold">Online · Replies in ~1 hr</p>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 dark:bg-neutral-900/50 space-y-4">
            {/* Mock Chat History */}
            <div className="flex justify-start">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl rounded-tl-sm px-4 py-2 border border-slate-200 dark:border-neutral-700 max-w-[80%] shadow-sm">
                <p className="text-sm text-slate-700 dark:text-neutral-300">Hi {MOCK_STUDENT.name.split(' ')[0]}! 👋 How can we help you today?</p>
                <p className="text-[10px] text-slate-400 mt-1">10:00 AM</p>
              </div>
            </div>
            {sent && (
              <div className="flex justify-end">
                <div className="bg-violet-600 rounded-2xl rounded-tr-sm px-4 py-2 text-white max-w-[80%] shadow-sm">
                  <p className="text-sm">Message sent successfully! We will review it shortly.</p>
                  <p className="text-[10px] text-violet-200 mt-1">Just now</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex gap-2">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none focus:border-violet-500 transition-colors"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 text-white w-12 rounded-xl flex items-center justify-center transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <EnvelopeSimple size={20} className="text-violet-600" /> Direct Email
            </h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">Prefer email? Reach us directly at our support desk.</p>
            <a href="mailto:support@englishpro.com" className="block text-center w-full bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              support@englishpro.com
            </a>
          </div>

          <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 p-5">
            <h3 className="font-bold text-violet-900 dark:text-violet-100 mb-1">Office Hours</h3>
            <p className="text-sm text-violet-700 dark:text-violet-300">Mon - Sat<br/>9:00 AM - 6:00 PM PKT</p>
          </div>
        </div>
      </div>
    </div>
  )
}