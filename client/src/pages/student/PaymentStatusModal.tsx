import { X, Clock, XCircle, ArrowCounterClockwise } from '@phosphor-icons/react'
import type { EnrolledPayment } from '@/types/api'

interface Props {
  payment: EnrolledPayment
  isOpen: boolean
  onClose: () => void
  onResubmit: () => void
}

const METHOD_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  nayapay: 'NayaPay',
  sadapay: 'SadaPay',
  zindigi: 'Zindigi',
  bank_local: 'Bank Transfer (Local)',
  bank_international: 'Bank Transfer (International)',
}

export default function PaymentStatusModal({ payment, isOpen, onClose, onResubmit }: Props) {
  if (!isOpen) return null

  const isPending = payment.status === 'pending'
  const isRejected = payment.status === 'rejected'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-700 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Payment Status</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-center py-4">
            {isPending ? (
              <div className="text-center">
                <Clock size={48} weight="fill" className="text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-slate-900 dark:text-white">Under Review</p>
                <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Your payment proof is being reviewed by our admin team.</p>
              </div>
            ) : (
              <div className="text-center">
                <XCircle size={48} weight="fill" className="text-red-500 mx-auto mb-3" />
                <p className="font-bold text-slate-900 dark:text-white">Payment Rejected</p>
                {payment.rejectionReason && (
                  <p className="text-sm text-red-500 dark:text-red-400 mt-1">Reason: {payment.rejectionReason}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Method</span>
              <span className="font-semibold text-slate-900 dark:text-white">{METHOD_LABELS[payment.method] ?? payment.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Amount</span>
              <span className="font-semibold text-slate-900 dark:text-white">{payment.currency} {payment.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-neutral-400">Submitted</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>

          {isRejected && (
            <button onClick={() => { onClose(); onResubmit() }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
              <ArrowCounterClockwise size={16} weight="bold" />
              Resubmit Payment
            </button>
          )}

          {isPending && (
            <p className="text-center text-xs text-slate-400 dark:text-neutral-600">
              You'll receive a notification once your payment is processed.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
