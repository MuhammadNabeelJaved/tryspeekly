import { useState, useEffect, useCallback } from 'react'
import {
  VideoCamera, CalendarBlank, FilePdf, ShieldCheck, ChatCircleDots,
  LockSimple, Warning, Handshake, BookOpen, ArrowRight, Star,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { enrollmentsService } from '@/services/enrollments.service'
import { reviewsService } from '@/services/reviews.service'
import { offersService } from '@/services/offers.service'
import type { Offer } from '@/services/offers.service'
import { getDiscountedPrice } from '@/utils/offerUtils'
import type { Enrollment, EnrolledPayment, Review } from '@/types/api'
import InstructorChatModal from '@/pages/student/InstructorChatModal'
import PaymentSubmitModal from '@/pages/student/PaymentSubmitModal'
import PaymentStatusModal from '@/pages/student/PaymentStatusModal'

// ─── Status config ────────────────────────────────────────────────────────────
function StatusBadge({ enrollment, payment }: { enrollment: Enrollment; payment: EnrolledPayment | undefined }) {
  const isActive = enrollment.isActive
  const isRejected = payment?.status === 'rejected'
  const hasPayment = !!payment

  if (isActive) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/40 uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Active
    </span>
  )
  if (isRejected) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/40 uppercase tracking-wide">
      <Warning size={10} weight="fill" /> Rejected
    </span>
  )
  if (hasPayment) return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full border border-amber-100 dark:border-amber-900/40 uppercase tracking-wide">
      <LockSimple size={10} weight="fill" /> Pending
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-900/40 uppercase tracking-wide">
      <LockSimple size={10} weight="fill" /> Awaiting Payment
    </span>
  )
}

// ─── Single enrollment card ───────────────────────────────────────────────────
function EnrollmentCard({
  enrollment, courseReview,
  onChat, onSubmitPayment, onViewStatus,
}: {
  enrollment: Enrollment
  courseReview?: Review
  onChat: () => void
  onSubmitPayment: () => void
  onViewStatus: () => void
}) {
  const attended = enrollment.progress?.sessionsAttended ?? 0
  const total = enrollment.progress?.totalSessions ?? 0
  const attendance = total > 0 ? Math.min(100, Math.round((attended / total) * 100)) : 0
  const isActive = enrollment.isActive
  const payment = enrollment.payment
  const hasPayment = !!payment
  const isRejected = payment?.status === 'rejected'
  const isFinancialAid = !!enrollment.financialAid
  const isCourseComplete = total > 0 && attended >= total

  const LEVEL_COLORS: Record<string, string> = {
    beginner: 'from-emerald-400 to-teal-500',
    intermediate: 'from-blue-400 to-indigo-500',
    advanced: 'from-violet-500 to-purple-600',
    business: 'from-amber-400 to-orange-500',
    kids: 'from-pink-400 to-rose-500',
  }
  const gradientKey = (enrollment.course as any)?.level?.toLowerCase() ?? 'beginner'
  const gradient = LEVEL_COLORS[gradientKey] ?? 'from-violet-500 to-purple-600'

  const inner = (
    <div className={`bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden transition-all duration-200 h-full flex flex-col ${
      isActive
        ? 'border-slate-200 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700/60 hover:shadow-lg hover:shadow-violet-100/40 dark:hover:shadow-violet-950/20'
        : 'border-slate-200 dark:border-neutral-800 opacity-90'
    }`}>

      {/* ── Coloured top strip ── */}
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

      {/* ── Card body ── */}
      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Row 1: status badges + attendance chip */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge enrollment={enrollment} payment={payment ?? undefined} />
            {isFinancialAid && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-full border border-teal-100 dark:border-teal-900/40 uppercase tracking-wide">
                <Handshake size={10} weight="fill" /> Aid
              </span>
            )}
            {courseReview && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${
                courseReview.status === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
              }`}>
                <Star size={9} weight="fill" />
                {courseReview.status === 'approved' ? 'Reviewed' : 'Review Pending'}
              </span>
            )}
            {isCourseComplete && !courseReview && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full border border-violet-100 dark:border-violet-900/40 uppercase tracking-wide">
                🎓 Completed
              </span>
            )}
          </div>

          {isActive && (
            <span className={`text-xs font-bold flex items-center gap-1 ${attendance >= 80 ? 'text-emerald-600 dark:text-emerald-400' : attendance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              <ShieldCheck size={14} weight="fill" />
              {attendance}%
            </span>
          )}
        </div>

        {/* Row 2: title + instructor */}
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-white leading-snug mb-1">
            {enrollment.course.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            with <span className="font-semibold text-slate-700 dark:text-neutral-300">{enrollment.teacher?.name ?? '—'}</span>
          </p>
        </div>

        {/* Row 3: progress bar + sessions */}
        {isActive && total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 dark:text-neutral-500 font-medium">Progress</span>
              <span className="font-bold text-slate-700 dark:text-neutral-300">{attended} / {total} sessions</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${gradient}`}
                style={{ width: `${attendance}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 4: info pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-slate-50 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-700">
            <CalendarBlank size={13} />
            {attended} of {total} sessions
          </div>

          {isActive && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); onChat() }}
              className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-3 py-1.5 rounded-lg border border-violet-100 dark:border-violet-900/30 transition-colors"
            >
              <ChatCircleDots size={13} weight="fill" />
              Chat
            </button>
          )}

          {isActive && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation() }}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-700 transition-colors"
            >
              <FilePdf size={13} />
              Materials
            </button>
          )}
        </div>

        {/* Spacer pushes CTA to bottom */}
        <div className="flex-1" />

        {/* Row 5: CTA */}
        {isActive ? (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-neutral-500">
              <VideoCamera size={14} weight="fill" />
              Live class
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-violet-600 dark:text-violet-400 group-hover:gap-2.5 transition-all">
              View Details <ArrowRight size={15} weight="bold" />
            </div>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-100 dark:border-neutral-800 space-y-2">
            {isRejected ? (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <Warning size={16} weight="fill" className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">Payment Rejected</p>
                  {payment?.rejectionReason && (
                    <p className="text-[11px] text-red-500/80 dark:text-red-400/60 mt-0.5">{payment.rejectionReason}</p>
                  )}
                </div>
              </div>
            ) : hasPayment ? (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onViewStatus() }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-900/30 text-sm font-bold transition-colors"
              >
                <span className="flex items-center gap-2"><LockSimple size={14} weight="fill" /> Payment Under Review</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onSubmitPayment() }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
              >
                <span className="flex items-center gap-2"><BookOpen size={14} weight="fill" /> Submit Payment to Unlock</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return isActive ? (
    <Link
      to={`/dashboard/courses/${enrollment.course._id}`}
      className="group block h-full"
    >
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [myReviews, setMyReviews] = useState<Review[]>([])
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])
  const [chatModal, setChatModal] = useState<{ name: string; courseTitle: string; instructorId: string; profileImage?: string } | null>(null)
  const [submitModal, setSubmitModal] = useState<{ courseId: string; teacherId: string; courseName?: string; coursePrice?: number; courseCurrency?: 'PKR' | 'USD'; pricingType?: 'monthly' | 'full_course' | 'per_session'; offerDiscountedPrice?: number; offerLabel?: string; hasSavedDiscount?: boolean } | null>(null)
  const [statusModal, setStatusModal] = useState<{ payment: EnrolledPayment; courseId: string; teacherId: string } | null>(null)

  const fetchEnrollments = useCallback(() => {
    setLoading(true)
    enrollmentsService.getMyEnrollments()
      .then(res => { if (res.success) setEnrollments(res.data.filter(e => e.course != null)) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchEnrollments() }, [fetchEnrollments])

  useEffect(() => {
    reviewsService.getMyReviews()
      .then(res => { if (res.success) setMyReviews(res.data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    let mounted = true
    offersService.getActiveOffers()
      .then(res => { if (mounted && res.success) setActiveOffers(res.data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const handlePaymentSuccess = () => {
    setSubmitModal(null)
    fetchEnrollments()
  }

  const openSubmitModal = (enrollment: Enrollment) => {
    const originalPrice = enrollment.course.currency === 'USD'
      ? (enrollment.course.priceUSD ?? 0)
      : (enrollment.course.price ?? 0)

    const savedDiscount = (enrollment.discountApplied || 0) + (enrollment.offerDiscountApplied || 0)
    let discountedPrice = undefined
    let offerLabel = undefined
    let hasSavedDiscount = savedDiscount > 0

    if (hasSavedDiscount) {
      discountedPrice = Math.max(0, originalPrice - savedDiscount)
      offerLabel = 'Discount'
    } else {
      const result = originalPrice > 0
        ? getDiscountedPrice(enrollment.course._id, originalPrice, activeOffers)
        : null
      if (result?.hasDiscount) {
        discountedPrice = result.discountedPrice
        offerLabel = result.offer?.title
      }
    }

    setSubmitModal({
      courseId: enrollment.course._id,
      teacherId: enrollment.teacher._id,
      courseName: enrollment.course.title,
      coursePrice: originalPrice,
      courseCurrency: enrollment.course.currency,
      pricingType: enrollment.course.pricingType,
      offerDiscountedPrice: discountedPrice,
      offerLabel: offerLabel,
      hasSavedDiscount
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-56 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  const active = enrollments.filter(e => e.isActive)
  const locked = enrollments.filter(e => !e.isActive)

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Live Classes</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          Join your live sessions, check your schedule, and access class materials.
        </p>
      </div>

      {/* Empty state */}
      {enrollments.length === 0 && (
        <div className="py-20 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-neutral-800">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-violet-500" weight="fill" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">You haven't enrolled in any courses.</p>
          <Link to="/courses" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
            Browse Courses <ArrowRight size={15} weight="bold" />
          </Link>
        </div>
      )}

      {/* Active enrollments */}
      {active.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
              Active Courses ({active.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {active.map(enrollment => {
              const attended = enrollment.progress?.sessionsAttended ?? 0
              const total = enrollment.progress?.totalSessions ?? 0
              const isCourseComplete = total > 0 && attended >= total
              const courseReview = isCourseComplete
                ? myReviews.find(r => r.type === 'course' && r.course?._id === enrollment.course._id)
                : undefined

              return (
                <EnrollmentCard
                  key={enrollment._id}
                  enrollment={enrollment}
                  courseReview={courseReview}
                  onChat={() => setChatModal({ name: enrollment.teacher?.name ?? '—', courseTitle: enrollment.course?.title ?? '—', instructorId: enrollment.teacher?._id ?? '', profileImage: enrollment.teacher?.profileImage })}
                  onSubmitPayment={() => openSubmitModal(enrollment)}
                  onViewStatus={() => setStatusModal({ payment: enrollment.payment!, courseId: enrollment.course?._id ?? '', teacherId: enrollment.teacher?._id ?? '' })}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Locked / pending enrollments */}
      {locked.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <LockSimple size={12} className="text-slate-400 dark:text-neutral-500" weight="fill" />
            <h3 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
              Pending / Locked ({locked.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {locked.map(enrollment => (
              <EnrollmentCard
                key={enrollment._id}
                enrollment={enrollment}
                onChat={() => setChatModal({ name: enrollment.teacher?.name ?? '—', courseTitle: enrollment.course?.title ?? '—', instructorId: enrollment.teacher?._id ?? '', profileImage: enrollment.teacher?.profileImage })}
                onSubmitPayment={() => openSubmitModal(enrollment)}
                onViewStatus={() => setStatusModal({ payment: enrollment.payment!, courseId: enrollment.course?._id ?? '', teacherId: enrollment.teacher?._id ?? '' })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <InstructorChatModal
        isOpen={!!chatModal}
        onClose={() => setChatModal(null)}
        instructorName={chatModal?.name ?? ''}
        instructorId={chatModal?.instructorId ?? ''}
        instructorProfileImage={chatModal?.profileImage}
        courseTitle={chatModal?.courseTitle ?? ''}
      />

      {submitModal && (
        <PaymentSubmitModal
          courseId={submitModal.courseId}
          teacherId={submitModal.teacherId}
          courseName={submitModal.courseName}
          coursePrice={submitModal.coursePrice}
          courseCurrency={submitModal.courseCurrency}
          pricingType={submitModal.pricingType}
          offerDiscountedPrice={submitModal.offerDiscountedPrice}
          offerLabel={submitModal.offerLabel}
          hasSavedDiscount={submitModal.hasSavedDiscount}
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
            const enrollment = enrollments.find(e => e.course._id === statusModal.courseId)
            setStatusModal(null)
            if (enrollment) openSubmitModal(enrollment)
            else setSubmitModal({ courseId: statusModal.courseId, teacherId: statusModal.teacherId })
          }}
        />
      )}
    </div>
  )
}
