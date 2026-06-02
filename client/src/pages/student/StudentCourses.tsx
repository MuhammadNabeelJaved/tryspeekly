import { useState, useEffect, useCallback } from 'react'
import {
  VideoCamera, CalendarBlank, FilePdf, ChatCircleDots, Clock, GraduationCap,
  LockSimple, Warning, Handshake, BookOpen, ArrowRight, Star,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import UserAvatar from '@/components/UserAvatar'
import { enrollmentsService } from '@/services/enrollments.service'
import { reviewsService } from '@/services/reviews.service'
import { offersService } from '@/services/offers.service'
import type { Offer } from '@/services/offers.service'
import { getDiscountedPrice } from '@/utils/offerUtils'
import type { Enrollment, EnrolledPayment, Review } from '@/types/api'
import InstructorChatModal from '@/pages/student/InstructorChatModal'
import PaymentSubmitModal from '@/pages/student/PaymentSubmitModal'
import PaymentStatusModal from '@/pages/student/PaymentStatusModal'

// ─── Level → cover gradient (fallback when a course has no thumbnail) ──────────
const LEVEL_GRADIENT: Record<string, string> = {
  beginner: 'from-emerald-400 via-teal-400 to-cyan-500',
  intermediate: 'from-sky-400 via-blue-500 to-indigo-500',
  advanced: 'from-violet-500 via-purple-500 to-fuchsia-600',
  business: 'from-amber-400 via-orange-500 to-rose-500',
  kids: 'from-pink-400 via-rose-400 to-red-500',
}

// ─── Compact, glassy status pill shown on the cover image ─────────────────────
function CoverStatus({ enrollment, payment }: { enrollment: Enrollment; payment: EnrolledPayment | undefined }) {
  const base = 'inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm uppercase tracking-wide bg-white/90 dark:bg-black/50'
  if (enrollment.isActive) return (
    <span className={`${base} text-emerald-600 dark:text-emerald-400`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
    </span>
  )
  if (payment?.status === 'rejected') return <span className={`${base} text-red-600 dark:text-red-400`}><Warning size={10} weight="fill" /> Rejected</span>
  if (payment) return <span className={`${base} text-amber-600 dark:text-amber-400`}><LockSimple size={10} weight="fill" /> Pending</span>
  return <span className={`${base} text-slate-600 dark:text-neutral-300`}><LockSimple size={10} weight="fill" /> Locked</span>
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
  const total = enrollment.progress?.totalSessions ?? enrollment.course.totalSessions ?? 0
  const attendance = total > 0 ? Math.min(100, Math.round((attended / total) * 100)) : 0
  const isActive = enrollment.isActive
  const payment = enrollment.payment
  const hasPayment = !!payment
  const isRejected = payment?.status === 'rejected'
  const isFinancialAid = !!enrollment.financialAid
  const isCourseComplete = total > 0 && attended >= total

  const level = (enrollment.course.level ?? 'beginner').toLowerCase()
  const gradient = LEVEL_GRADIENT[level] ?? LEVEL_GRADIENT.beginner
  const thumbnail = enrollment.course.thumbnail
  const schedule = enrollment.course.recurringSchedule?.[0]

  const inner = (
    <div className={`bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 overflow-hidden h-full flex flex-col transition-all duration-300 ${
      isActive ? 'hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 dark:hover:shadow-black/40' : ''
    }`}>

      {/* ── Cover ── */}
      <div className="relative h-36 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={enrollment.course.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'group-hover/card:scale-105' : 'grayscale opacity-70'}`}
          />
        ) : (
          <div className={`relative w-full h-full bg-gradient-to-br ${gradient} ${!isActive ? 'grayscale opacity-80' : ''}`}>
            <BookOpen size={52} weight="duotone" className="absolute right-4 bottom-3 text-white/25" />
          </div>
        )}
        {/* legibility overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {/* level pill */}
        <span className="absolute top-3 left-3 inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md text-slate-700 dark:text-white capitalize shadow-sm">
          {enrollment.course.level ?? 'Course'}
        </span>
        {/* status */}
        <div className="absolute top-3 right-3">
          <CoverStatus enrollment={enrollment} payment={payment ?? undefined} />
        </div>
        {/* lock overlay for inactive */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
              <LockSimple size={18} weight="fill" className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5 flex flex-col gap-3.5 flex-1">

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 min-h-[2.6rem]">
          {enrollment.course.title}
        </h4>

        {/* Instructor + secondary tags */}
        <div className="flex items-center gap-2.5">
          <UserAvatar src={enrollment.teacher?.profileImage} name={enrollment.teacher?.name} size="xs" />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 leading-none mb-0.5 uppercase tracking-wide">Instructor</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-neutral-200 truncate">{enrollment.teacher?.name ?? '—'}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            {isFinancialAid && (
              <span title="Financial aid" className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                <Handshake size={10} weight="fill" /> Aid
              </span>
            )}
            {courseReview ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                courseReview.status === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                <Star size={10} weight="fill" /> {courseReview.status === 'approved' ? 'Reviewed' : 'In review'}
              </span>
            ) : isCourseComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                <GraduationCap size={11} weight="fill" /> Done
              </span>
            )}
          </div>
        </div>

        {/* Progress (active) */}
        {isActive && total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 dark:text-neutral-500 font-medium">{attended} of {total} sessions</span>
              <span className="font-bold text-slate-700 dark:text-neutral-200">{attendance}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`} style={{ width: `${attendance}%` }} />
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-neutral-500">
          <span className="inline-flex items-center gap-1.5"><CalendarBlank size={13} /> {total} sessions</span>
          {schedule && (
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {schedule.day.slice(0, 3)} · {schedule.time}</span>
          )}
        </div>

        {/* Spacer pushes footer to bottom */}
        <div className="flex-1" />

        {/* Footer */}
        {isActive ? (
          <>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onChat() }}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-neutral-300 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-3 py-2 rounded-xl transition-colors"
              >
                <ChatCircleDots size={14} weight="fill" /> Chat
              </button>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation() }}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-neutral-300 bg-slate-50 hover:bg-slate-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 px-3 py-2 rounded-xl transition-colors"
              >
                <FilePdf size={14} /> Materials
              </button>
            </div>
            <div className="flex items-center justify-between pt-3.5 mt-1 border-t border-slate-100 dark:border-neutral-800">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                <VideoCamera size={14} weight="fill" /> Live class
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 dark:text-violet-400 group-hover/card:gap-2.5 transition-all">
                View details <ArrowRight size={15} weight="bold" />
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {isRejected && (
              <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                <Warning size={16} weight="fill" className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">Payment rejected</p>
                  {payment?.rejectionReason && (
                    <p className="text-[11px] text-red-500/80 dark:text-red-400/60 mt-0.5">{payment.rejectionReason}</p>
                  )}
                </div>
              </div>
            )}
            {isRejected ? (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onSubmitPayment() }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
              >
                <BookOpen size={14} weight="fill" /> Resubmit Payment
              </button>
            ) : hasPayment ? (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onViewStatus() }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-bold transition-colors"
              >
                <span className="flex items-center gap-2"><LockSimple size={14} weight="fill" /> Payment under review</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onSubmitPayment() }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
              >
                <span className="flex items-center gap-2"><BookOpen size={14} weight="fill" /> Submit payment to unlock</span>
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
      className="group/card block h-full"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-5">
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
