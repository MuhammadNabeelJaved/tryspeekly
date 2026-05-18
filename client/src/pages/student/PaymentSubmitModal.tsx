import { useState, useRef } from 'react'
import { X, UploadSimple, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { PaymentMethod } from '@/types/api'

interface Props {
  courseId: string
  teacherId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'nayapay', label: 'NayaPay' },
  { value: 'sadapay', label: 'SadaPay' },
  { value: 'zindigi', label: 'Zindigi' },
  { value: 'bank_local', label: 'Bank Transfer (Local)' },
  { value: 'bank_international', label: 'Bank Transfer (International)' },
]

export default function PaymentSubmitModal({ courseId, teacherId, isOpen, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('jazzcash')
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const reset = () => {
    setMethod('jazzcash')
    setTransactionId('')
    setAmount('')
    setCurrency('PKR')
    setFile(null)
    setError('')
    setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please upload a payment screenshot.'); return }
    if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    setLoading(true)
    setError('')
    try {
      await paymentsService.createPayment({
        courseId,
        teacherId,
        method,
        transactionId: transactionId || undefined,
        amount: Number(amount),
        currency,
        screenshot: file,
      })
      setSuccess(true)
      setTimeout(() => { reset(); onSuccess() }, 2000)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Submit Payment Proof</h3>
          <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} weight="fill" className="text-emerald-500 mx-auto mb-3" />
            <p className="font-bold text-slate-900 dark:text-white">Payment submitted!</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Awaiting admin approval.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                <WarningCircle size={16} weight="fill" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Transaction ID <span className="normal-case font-normal">(optional)</span></label>
              <input value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. TXN123456"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Amount *</label>
                <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600" />
              </div>
              <div className="w-24">
                <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'PKR' | 'USD')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                  <option value="PKR">PKR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Payment Screenshot *</label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-500 dark:text-neutral-400 hover:border-violet-400 hover:text-violet-600 transition-colors">
                <UploadSimple size={16} />
                {file ? file.name : 'Click to upload screenshot'}
              </button>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-sm transition-colors">
              {loading ? 'Submitting…' : 'Submit Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
