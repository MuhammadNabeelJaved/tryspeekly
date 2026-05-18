import { useState, useEffect } from 'react'
import { Receipt, CheckCircle, Clock, XCircle, Image } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { Payment } from '@/types/api'

const METHOD_LABELS: Record<string, string> = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  nayapay: 'NayaPay',
  sadapay: 'SadaPay',
  zindigi: 'Zindigi',
  bank_local: 'Bank (Local)',
  bank_international: 'Bank (Intl)',
}

export default function StudentPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    paymentsService.getMyPayments()
      .then(res => { if (res.success) setPayments(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Payments</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">View and manage your payment history and receipts.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Course</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Screenshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-neutral-400">
                    No payment records found.
                  </td>
                </tr>
              )}
              {payments.map(payment => (
                <>
                  <tr key={payment._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-neutral-400 font-medium">
                      {new Date(payment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {payment.course.title}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 dark:text-neutral-400">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-neutral-800 text-xs font-semibold">
                        <Receipt size={14} />
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white text-right">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {payment.status === 'approved' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={12} weight="fill" /> Approved
                        </span>
                      )}
                      {payment.status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          <Clock size={12} weight="fill" /> Pending
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                          <XCircle size={12} weight="fill" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                      {payment.screenshotUrl ? (
                        <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer"
                          className="text-violet-600 hover:text-violet-700 font-semibold flex items-center justify-end gap-1">
                          <Image size={16} />
                          View
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-neutral-500">—</span>
                      )}
                    </td>
                  </tr>
                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <tr key={`${payment._id}-reason`} className="bg-red-50/50 dark:bg-red-950/10">
                      <td colSpan={6} className="px-5 py-2 text-xs text-red-600 dark:text-red-400">
                        <span className="font-bold">Rejection reason:</span> {payment.rejectionReason}
                        {payment.adminNote && <span className="ml-4 text-slate-500 dark:text-neutral-500">Note: {payment.adminNote}</span>}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
