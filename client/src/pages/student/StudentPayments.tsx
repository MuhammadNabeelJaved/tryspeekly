import React, { useState, useEffect, useCallback } from 'react'
import { Receipt, CheckCircle, Clock, XCircle, Image, LockSimple, ArrowClockwise, Warning } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import { enrollmentsService } from '@/services/enrollments.service'
import type { Payment, Enrollment } from '@/types/api'
import PaymentSubmitModal from '@/pages/student/PaymentSubmitModal'

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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState<{ courseId: string; teacherId: string; courseName?: string; coursePrice?: number; courseCurrency?: 'PKR' | 'USD' } | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    Promise.all([
      paymentsService.getMyPayments(),
      enrollmentsService.getMyEnrollments(),
    ])
      .then(([paymentsRes, enrollmentsRes]) => {
        if (paymentsRes.success) setPayments(paymentsRes.data)
        if (enrollmentsRes.success) setEnrollments(enrollmentsRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const unpaidEnrollments = enrollments.filter(e => !e.payment && !e.isActive && !e.financialAid)

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

      {unpaidEnrollments.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Warning size={16} weight="fill" className="text-amber-500" />
            <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400">Awaiting Payment</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-200 dark:bg-amber-800/50 text-amber-700 dark:text-amber-400 rounded-full">{unpaidEnrollments.length}</span>
          </div>
          <div className="space-y-3">
            {unpaidEnrollments.map(e => (
              <div key={e._id} className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{e.course.title}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-300">{e.teacher?.name ?? '—'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSubmitModal({ courseId: e.course._id, teacherId: e.teacher._id, courseName: e.course.title, coursePrice: e.course.currency === 'USD' ? (e.course.priceUSD ?? 0) : (e.course.price ?? 0), courseCurrency: e.course.currency })}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors"
                >
                  Submit Payment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Course</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Access</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500 dark:text-neutral-400">
                    No payment records found.
                  </td>
                </tr>
              )}
              {payments.map(payment => (
                <React.Fragment key={payment._id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
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
                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      {payment.enrollmentActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle size={12} weight="fill" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
                          <LockSimple size={12} weight="fill" /> Locked
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {payment.screenshotUrl && (
                          <a href={payment.screenshotUrl} target="_blank" rel="noopener noreferrer"
                            className="text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 text-xs">
                            <Image size={14} />
                            View
                          </a>
                        )}
                        {payment.status === 'rejected' && (
                          <button
                            onClick={() => setSubmitModal({ courseId: payment.course._id, teacherId: payment.teacher._id })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-colors"
                          >
                            <ArrowClockwise size={11} weight="bold" />
                            Resubmit
                          </button>
                        )}
                        {!payment.screenshotUrl && payment.status !== 'rejected' && (
                          <span className="text-slate-400 dark:text-neutral-500 text-xs">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                  {payment.status === 'rejected' && payment.rejectionReason && (
                    <tr className="bg-red-50/50 dark:bg-red-950/10">
                      <td colSpan={7} className="px-5 py-2 text-xs text-red-600 dark:text-red-400">
                        <span className="font-bold">Rejection reason:</span> {payment.rejectionReason}
                        {payment.adminNote && <span className="ml-4 text-slate-500 dark:text-neutral-500">Note: {payment.adminNote}</span>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {submitModal && (
        <PaymentSubmitModal
          courseId={submitModal.courseId}
          teacherId={submitModal.teacherId}
          courseName={submitModal.courseName}
          coursePrice={submitModal.coursePrice}
          courseCurrency={submitModal.courseCurrency}
          isOpen={!!submitModal}
          onClose={() => setSubmitModal(null)}
          onSuccess={() => { setSubmitModal(null); fetchData() }}
        />
      )}
    </div>
  )
}
