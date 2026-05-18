import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Handshake, Clock, CheckCircle, XCircle, X, SpinnerGap } from '@phosphor-icons/react'
import { financialAidService } from '@/services/financial-aid.service'
import { useAuth } from '@/context/AuthContext'
import type { FinancialAid } from '@/types/api'

function StatusBadge({ status }: { status: FinancialAid['status'] }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
      <Clock size={12} weight="fill" /> Pending
    </span>
  )
  if (status === 'under_review') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
      <Clock size={12} weight="fill" /> Under Review
    </span>
  )
  if (status === 'accepted') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
      <CheckCircle size={12} weight="fill" /> Approved
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
      <XCircle size={12} weight="fill" /> Rejected
    </span>
  )
}

interface ApplyModalProps {
  onClose: () => void
  onSuccess: () => void
  defaultName: string
  defaultEmail: string
}

function ApplyModal({ onClose, onSuccess, defaultName, defaultEmail }: ApplyModalProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) { setError('Please provide a reason for your application.'); return }
    setError('')
    setSubmitting(true)
    try {
      await financialAidService.apply({ name, email, phone: phone || undefined, reason })
      onSuccess()
    } catch {
      setError('Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Handshake size={20} className="text-blue-600 dark:text-blue-400" weight="fill" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white">Apply for Financial Aid</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Tell us why you need assistance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Phone <span className="font-normal text-slate-400">(optional)</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+92 300 0000000"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Reason for Application</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4}
              placeholder="Explain why you need financial aid and how it will help you..."
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none" />
          </div>

          {error && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-neutral-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2">
              {submitting ? <><SpinnerGap size={16} className="animate-spin" /> Submitting...</> : 'Submit Application'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function StudentFinancialAid() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<FinancialAid[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchApplications = useCallback(() => {
    setLoading(true)
    financialAidService.getMyApplications()
      .then(res => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  const handleSuccess = () => {
    setShowModal(false)
    fetchApplications()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Financial Aid</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">View the status of your financial aid applications.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors">
          Apply for Aid
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          [1, 2].map(i => (
            <div key={i} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-neutral-800 rounded-xl" />
                <div className="h-6 w-24 bg-slate-100 dark:bg-neutral-800 rounded-full" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 dark:bg-neutral-800 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : applications.length === 0 ? (
          <div className="col-span-2 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-neutral-700">
            <Handshake size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No Financial Aid Applications</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">You haven't applied for any financial aid yet.</p>
          </div>
        ) : (
          applications.map((aid, index) => (
            <motion.div key={aid._id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Handshake size={20} weight="fill" />
                </div>
                <StatusBadge status={aid.status} />
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {aid.course?.title ?? 'General Financial Aid'}
              </h3>

              <div className="space-y-2 text-sm text-slate-600 dark:text-neutral-400 mb-4">
                <p><strong className="text-slate-900 dark:text-neutral-200">Applied On:</strong> {new Date(aid.appliedAt).toLocaleDateString()}</p>
                {aid.approvedAmount != null && (
                  <p><strong className="text-slate-900 dark:text-neutral-200">Approved Amount:</strong> PKR {aid.approvedAmount.toLocaleString()}</p>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-slate-100 dark:border-neutral-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Reason</p>
                <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 italic">"{aid.reason}"</p>
              </div>

              {aid.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/20 mt-3">
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-1">Admin Notes</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">{aid.notes}</p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ApplyModal
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
            defaultName={user?.name ?? ''}
            defaultEmail={user?.email ?? ''}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
