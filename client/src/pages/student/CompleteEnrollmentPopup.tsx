import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, CreditCard, Warning, BookOpen, ArrowRight } from '@phosphor-icons/react'
import type { Enrollment } from '@/types/api'
import PaymentSubmitModal from './PaymentSubmitModal'

interface Props {
  enrollments: Enrollment[]
  onClose: () => void
  onPaymentSuccess: () => void
}

export default function CompleteEnrollmentPopup({ enrollments, onClose, onPaymentSuccess }: Props) {
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null)

  if (enrollments.length === 0) return null

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-neutral-800 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-amber-50 dark:bg-amber-900/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CreditCard size={20} weight="fill" className="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Complete Your Enrollment</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400">Submit payment to activate your access</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-3 max-h-[55vh] overflow-y-auto">
            <p className="text-sm text-slate-600 dark:text-neutral-400 mb-4">
              {enrollments.length === 1
                ? 'You have 1 enrollment that requires payment to become active.'
                : `You have ${enrollments.length} enrollments that require payment to become active.`}
            </p>

            {enrollments.map(enrollment => {
              const isRejected = enrollment.payment?.status === 'rejected'
              return (
                <div
                  key={enrollment._id}
                  className={`rounded-xl border p-4 ${
                    isRejected
                      ? 'border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10'
                      : 'border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        isRejected
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-amber-100 dark:bg-amber-900/30'
                      }`}>
                        {isRejected
                          ? <Warning size={18} weight="fill" className="text-red-500 dark:text-red-400" />
                          : <BookOpen size={18} weight="fill" className="text-amber-600 dark:text-amber-400" />
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {enrollment.course.title}
                        </p>
                        {isRejected ? (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                            Payment rejected
                            {enrollment.payment?.rejectionReason
                              ? ` — ${enrollment.payment.rejectionReason}`
                              : ''}
                          </p>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                            Payment required to activate
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEnrollment(enrollment)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                    >
                      Pay Now <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
            <p className="text-xs text-slate-400 dark:text-neutral-500 text-center">
              Your enrollment will be activated once your payment is reviewed and approved.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Open PaymentSubmitModal when a course is selected */}
      {selectedEnrollment && (
        <PaymentSubmitModal
          courseId={selectedEnrollment.course._id}
          teacherId={selectedEnrollment.teacher._id}
          isOpen={true}
          onClose={() => setSelectedEnrollment(null)}
          onSuccess={() => {
            setSelectedEnrollment(null)
            onPaymentSuccess()
          }}
        />
      )}
    </>
  )
}
