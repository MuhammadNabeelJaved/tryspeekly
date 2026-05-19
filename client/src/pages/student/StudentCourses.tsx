import { useState, useEffect, useCallback } from 'react'
import { VideoCamera, CalendarBlank, FilePdf, ShieldCheck, ChatCircleDots, LockSimple, Warning, Handshake } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { enrollmentsService } from '@/services/enrollments.service'
import type { Enrollment, EnrolledPayment } from '@/types/api'
import InstructorChatModal from '@/pages/student/InstructorChatModal'
import PaymentSubmitModal from '@/pages/student/PaymentSubmitModal'
import PaymentStatusModal from '@/pages/student/PaymentStatusModal'

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [chatModal, setChatModal] = useState<{ name: string; courseTitle: string } | null>(null)
  const [submitModal, setSubmitModal] = useState<{ courseId: string; teacherId: string } | null>(null)
  const [statusModal, setStatusModal] = useState<{ payment: EnrolledPayment; courseId: string; teacherId: string } | null>(null)

  const fetchEnrollments = useCallback(() => {
    setLoading(true)
    enrollmentsService.getMyEnrollments()
      .then(res => { if (res.success) setEnrollments(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  const handlePaymentSuccess = () => {
    setSubmitModal(null)
    fetchEnrollments()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Live Classes</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Join your live sessions, check your schedule, and access class materials.</p>
      </div>

      {enrollments.length === 0 && (
        <div className="py-20 text-center">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">You haven't enrolled in any courses.</p>
          <Link to="/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm">Browse Courses</Link>
        </div>
      )}

      {enrollments.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Enrollments</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {enrollments.map(enrollment => {
              const attended = enrollment.progress?.sessionsAttended ?? 0
              const total = enrollment.progress?.totalSessions ?? 0
              const attendance = total > 0 ? Math.round((attended / total) * 100) : 0
              const isActive = enrollment.isActive
              const payment = enrollment.payment
              const hasPayment = !!payment
              const isRejected = payment?.status === 'rejected'
              const isFinancialAid = !!enrollment.financialAid

              const cardContent = (
                <>
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md uppercase tracking-wide">
                            Active
                          </span>
                        ) : isRejected ? (
                          <span className="text-[10px] font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                            <Warning size={10} weight="fill" /> Payment Rejected
                          </span>
                        ) : hasPayment ? (
                          <span className="text-[10px] font-bold px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                            <LockSimple size={10} weight="fill" /> Payment Pending
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                            <LockSimple size={10} weight="fill" /> Submit Payment
                          </span>
                        )}
                        {isFinancialAid && (
                          <span className="text-[10px] font-bold px-2 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-md uppercase tracking-wide flex items-center gap-1">
                            <Handshake size={10} weight="fill" /> Financial Aid
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                        <ShieldCheck size={14} weight="fill" />
                        {attendance}% ({attended}/{total})
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1">
                      {enrollment.course.title}
                    </h4>

                    <div className="flex items-center justify-between mb-5">
                      <p className="text-sm text-slate-500 dark:text-neutral-400">
                        Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-300">{enrollment.teacher?.name ?? '—'}</span>
                      </p>
                      {isActive && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setChatModal({ name: enrollment.teacher?.name ?? '—', courseTitle: enrollment.course.title })
                          }}
                          className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <ChatCircleDots size={16} weight="fill" />
                          Chat
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 p-3 rounded-xl border border-slate-100 dark:border-neutral-700">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500 shadow-sm">
                          <CalendarBlank size={16} weight="fill" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Sessions</p>
                          <p>{attended} of {total} completed</p>
                        </div>
                      </div>

                      {isActive && (
                        <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                          <FilePdf size={18} />
                          Class Materials & Notes
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6 md:w-64 bg-slate-50 dark:bg-neutral-900/50 flex flex-col justify-center">
                    {isActive ? (
                      <>
                        <div className="text-center mb-5">
                          <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                            <VideoCamera size={24} weight="fill" />
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Your Progress</p>
                          <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{attendance}%</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">attendance rate</p>
                        </div>
                        <div className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white font-bold py-3 rounded-xl text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)]">
                          View Course Details
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500">
                          <LockSimple size={24} weight="fill" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">Course Locked</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                            {hasPayment ? 'Awaiting payment confirmation' : 'Submit payment to unlock'}
                          </p>
                        </div>
                        {hasPayment ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setStatusModal({ payment: payment!, courseId: enrollment.course._id, teacherId: enrollment.teacher._id })
                            }}
                            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white font-bold text-sm transition-colors hover:bg-slate-300 dark:hover:bg-neutral-600"
                          >
                            View Payment Status
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSubmitModal({ courseId: enrollment.course._id, teacherId: enrollment.teacher._id })
                            }}
                            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors"
                          >
                            Submit Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )

              return isActive ? (
                <Link
                  to={`/dashboard/courses/${enrollment.course._id}`}
                  key={enrollment._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors group"
                >
                  {cardContent}
                </Link>
              ) : (
                <div
                  key={enrollment._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row"
                >
                  {cardContent}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <InstructorChatModal
        isOpen={!!chatModal}
        onClose={() => setChatModal(null)}
        instructorName={chatModal?.name ?? ''}
        courseTitle={chatModal?.courseTitle ?? ''}
      />

      {submitModal && (
        <PaymentSubmitModal
          courseId={submitModal.courseId}
          teacherId={submitModal.teacherId}
          isOpen={!!submitModal}
          onClose={() => setSubmitModal(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {statusModal && (
        <PaymentStatusModal
          payment={statusModal.payment}
          isOpen={!!statusModal}
          onClose={() => setStatusModal(null)}
          onResubmit={() => {
            setStatusModal(null)
            setSubmitModal({ courseId: statusModal.courseId, teacherId: statusModal.teacherId })
          }}
        />
      )}
    </div>
  )
}
