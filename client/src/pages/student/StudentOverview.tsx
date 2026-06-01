import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarBlank, CheckCircle, CreditCard, Clock, VideoCamera, HandWaving, Megaphone, ClipboardText, ChartLineUp, Certificate, ArrowRight, Warning, X } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { enrollmentsService } from '../../services/enrollments.service'
import { paymentsService } from '../../services/payments.service'
import { liveClassService } from '@/services/live-class.service'
import { assignmentsService } from '@/services/assignments.service'
import { announcementsService } from '@/services/announcements.service'
import type { StudentView } from '../StudentDashboardPage'
import type { Enrollment, Assignment, Announcement, Payment } from '../../types/api'
import StudentAssignmentModal from './StudentAssignmentModal'
import PaymentSubmitModal from './PaymentSubmitModal'

type UpcomingClass = {
  _id: string
  course: { _id: string; title: string; totalSessions: number }
  teacher: { _id: string; name: string }
  meetingLink: string
  classNumber: number
  scheduledAt: string | null
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  createdAt: string
}

export default function StudentOverview({ onNavigate }: { onNavigate: (view: StudentView) => void }) {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [liveClassToast, setLiveClassToast] = useState<UpcomingClass | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ assignment: Assignment; enrollmentId: string } | null>(null)
  const [selectedPayEnrollment, setSelectedPayEnrollment] = useState<Enrollment | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true)
      const [enrollRes, liveRes, assignRes, annRes, payRes] = await Promise.allSettled([
        enrollmentsService.getMyEnrollments(),
        liveClassService.getStudentUpcomingClasses(),
        assignmentsService.getMyAssignments(),
        announcementsService.getMyAnnouncements(),
        paymentsService.getMyPayments(),
      ])

      if (enrollRes.status === 'fulfilled' && enrollRes.value.success) setEnrollments(enrollRes.value.data)
      if (liveRes.status === 'fulfilled' && liveRes.value.success)
        setUpcomingClasses(liveRes.value.data as UpcomingClass[])
      if (assignRes.status === 'fulfilled' && assignRes.value.success) setAssignments(assignRes.value.data)
      if (annRes.status === 'fulfilled' && annRes.value.success) setAnnouncements(annRes.value.data)
      if (payRes.status === 'fulfilled' && payRes.value.success) setPayments(payRes.value.data)
      setIsLoading(false)
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleUpdated = (liveClass: UpcomingClass) => {
      setUpcomingClasses((prev) => {
        const filtered = prev.filter((c) => c._id !== liveClass._id)
        if (liveClass.status === 'active' || liveClass.status === 'scheduled') {
          return [...filtered, liveClass].sort((a, b) => {
            if (a.scheduledAt && b.scheduledAt)
              return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
            return 0
          })
        }
        return filtered
      })

      // Show real-time toast when teacher starts a live class
      if (liveClass.status === 'active') {
        setLiveClassToast(liveClass)
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setLiveClassToast(null), 8000)
      }
    }

    const handleDeleted = ({ _id }: { _id: string }) => {
      setUpcomingClasses((prev) => prev.filter((c) => c._id !== _id))
    }

    socket.on('live-class:updated', handleUpdated)
    socket.on('live-class:deleted', handleDeleted)

    return () => {
      socket.off('live-class:updated', handleUpdated)
      socket.off('live-class:deleted', handleDeleted)
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [socket])

  const activeCourses = enrollments
  const avgAttendance = activeCourses.length > 0
    ? Math.round(
        activeCourses.reduce((acc, e) => {
          const total = e.progress.totalSessions
          const attended = e.progress.sessionsAttended
          return acc + (total > 0 ? Math.min(100, Math.round((attended / total) * 100)) : 0)
        }, 0) / activeCourses.length
      )
    : 0

  const pendingAssignments = assignments.filter(a => !a.submissions || a.submissions.length === 0)
  const recentPayments = payments.slice(0, 3)
  const unpaidEnrollments = enrollments.filter(e =>
    !e.isActive && (!e.payment || e.payment.status === 'rejected')
  )

  // Banner only shows when a class is LIVE NOW — not for future-scheduled classes
  const activeLiveClass = upcomingClasses.find(c => c.status === 'active') ?? null
  const bannerClass = activeLiveClass

  const scheduleLabel = (e: Enrollment) => {
    const rs = e.course.recurringSchedule
    if (!rs || rs.length === 0) return null
    const days = rs.map(r => r.day.slice(0, 3)).join(', ')
    return `${days} • ${rs[0].time}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-gradient-to-r from-violet-200 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30 rounded-[24px] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-4">
            <div className="h-48 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-40 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-40 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  const dismissToast = () => {
    setLiveClassToast(null)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }

  return (
    <div className="space-y-6">

      {/* ── Real-time Live Class Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {liveClassToast && (
          <motion.div
            key="live-toast"
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed top-4 right-4 z-[9999] w-[300px] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-neutral-700 overflow-hidden"
          >
            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-1 bg-red-500 origin-left"
            />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Live Now</span>
                </div>
                <button onClick={dismissToast} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-0.5">
                  <X size={13} weight="bold" />
                </button>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white mb-0.5">Class is starting!</p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mb-3 truncate font-medium">{liveClassToast.course.title}</p>
              {liveClassToast.meetingLink ? (
                <a
                  href={liveClassToast.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  <VideoCamera size={14} weight="fill" />
                  Join Now
                </a>
              ) : (
                <p className="text-center text-xs text-slate-400 dark:text-neutral-500 py-1">Meeting link not set yet</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome & Next Class Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-violet-600/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2">
              Hello, {user?.name?.split(' ')[0] ?? 'Student'}! <HandWaving size={28} className="text-amber-300" weight="fill" />
            </h2>
            <p className="text-violet-100 max-w-lg mb-6">Ready for your live sessions? Check your schedule and join your classes on time.</p>
          </div>

          {bannerClass ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[300px]">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-widest">Live Class</p>
                <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/80 px-2 py-0.5 rounded-full text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE NOW
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight mb-3 truncate" title={bannerClass.course.title}>
                {bannerClass.course.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-violet-100 mb-4">
                <Clock size={16} weight="fill" />
                <span>
                  Started {new Date(bannerClass.createdAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>

              {bannerClass.meetingLink ? (
                <a
                  href={bannerClass.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-violet-600 w-full py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
                >
                  <VideoCamera size={18} weight="fill" />
                  Join Live Class
                </a>
              ) : (
                <div className="flex items-center justify-center gap-2 bg-white/20 text-white/70 w-full py-2.5 rounded-xl font-bold text-sm">
                  <VideoCamera size={18} weight="fill" />
                  Link not set yet
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <VideoCamera size={24} weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{activeCourses.length}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mt-1">Active Batches</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
            <ChartLineUp size={24} weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{avgAttendance}%</p>
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mt-1">Avg Attendance</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <ClipboardText size={24} weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{pendingAssignments.length}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mt-1">Pending Tasks</p>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Certificate size={24} weight="fill" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {payments.filter(p => p.status === 'approved').length}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mt-1">Certificates</p>
          </div>
        </div>
      </div>

      {/* Complete Your Enrollment Banner */}
      {unpaidEnrollments.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <CreditCard size={16} weight="fill" className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-black text-amber-900 dark:text-amber-200 text-sm">Complete Your Enrollment</p>
              <p className="text-xs text-amber-700/70 dark:text-amber-400/70">Submit payment to activate your course access</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-amber-800/20">
            {unpaidEnrollments.map(enrollment => {
              const isRejected = enrollment.payment?.status === 'rejected'
              return (
                <div key={enrollment._id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center ${isRejected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      {isRejected
                        ? <Warning size={14} weight="fill" className="text-red-500 dark:text-red-400" />
                        : <CreditCard size={14} weight="fill" className="text-amber-600 dark:text-amber-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{enrollment.course.title}</p>
                      {isRejected ? (
                        <p className="text-xs text-red-500 dark:text-red-400">
                          Payment rejected{enrollment.payment?.rejectionReason ? ` — ${enrollment.payment.rejectionReason}` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400">Payment required to activate</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPayEnrollment(enrollment)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Pay Now <ArrowRight size={11} weight="bold" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* Enrolled Courses */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarBlank size={20} weight="fill" className="text-violet-600" />
                My Live Classes
              </h3>
              <button onClick={() => onNavigate('courses')} className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                View All <ArrowRight size={12} weight="bold" />
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCourses.length > 0 ? activeCourses.map(enrollment => {
                const attended = enrollment.progress.sessionsAttended
                const total = enrollment.progress.totalSessions
                const attendance = total > 0 ? Math.min(100, Math.round((attended / total) * 100)) : 0
                const schedule = scheduleLabel(enrollment)
                const liveForCourse = upcomingClasses.find(c => c.course._id === enrollment.course._id)

                return (
                  <Link
                    key={enrollment._id}
                    to={`/dashboard/courses/${enrollment.course._id}`}
                    className="bg-slate-50 dark:bg-neutral-800/30 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 flex flex-col hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                        <VideoCamera size={20} weight="fill" />
                      </div>
                      {enrollment.course.level && (
                        <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 rounded-md border border-slate-200 dark:border-neutral-700">
                          {enrollment.course.level}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {enrollment.course.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">Inst: {enrollment.teacher?.name ?? '—'}</p>

                    <div className="mt-auto space-y-2">
                      {schedule && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 p-2 rounded-lg border border-slate-100 dark:border-neutral-700">
                          <CalendarBlank size={14} className="text-violet-600" />
                          {schedule}
                        </div>
                      )}
                      {liveForCourse && (
                        <div className={`flex items-center gap-2 text-xs font-semibold p-2 rounded-lg border ${
                          liveForCourse.status === 'active'
                            ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                            : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/20'
                        }`}>
                          <Clock size={14} />
                          {liveForCourse.status === 'active' ? 'LIVE NOW' : (
                            liveForCourse.scheduledAt
                              ? `Next: ${new Date(liveForCourse.scheduledAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                              : 'Scheduled'
                          )}
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs font-bold pt-1">
                        <span className="text-slate-500 dark:text-neutral-400">Attendance</span>
                        <span className={attendance >= 80 ? 'text-green-600' : 'text-amber-500'}>
                          {attendance}% ({attended}/{total})
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              }) : (
                <div className="col-span-2 text-center py-6">
                  <p className="text-sm text-slate-500 dark:text-neutral-400">No active classes. Register for a new batch today!</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Assignments */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-900/5">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardText size={20} weight="fill" className="text-amber-500" />
                Pending Tasks & Assignments
              </h3>
            </div>
            <div className="p-0">
              {pendingAssignments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {pendingAssignments.slice(0, 5).map(assignment => (
                    <div key={assignment._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{assignment.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2">{assignment.course.title}</p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                          <Clock size={12} weight="bold" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const enrollment = enrollments.find(e => e.course._id === assignment.course._id)
                          setSelectedTask({ assignment, enrollmentId: enrollment?._id ?? '' })
                          setSubmitModalOpen(true)
                        }}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        Submit Task
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle size={32} weight="light" className="mx-auto text-green-500 mb-3" />
                  <p className="text-sm font-bold text-slate-900 dark:text-white">You're all caught up!</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">No pending assignments at the moment.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Noticeboard */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/5">
              <Megaphone size={20} weight="fill" className="text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">Noticeboard</h3>
            </div>
            <div className="p-0 divide-y divide-slate-100 dark:divide-neutral-800">
              {announcements.length > 0 ? announcements.slice(0, 5).map(ann => (
                <div key={ann._id} className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      ann.type === 'alert' ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                      : ann.type === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                    }`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{ann.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">{ann.content}</p>
                </div>
              )) : (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-neutral-400">No announcements yet.</div>
              )}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Payments</h3>
              <button onClick={() => onNavigate('payments')} className="text-xs font-bold text-violet-600 hover:text-violet-700">View All</button>
            </div>
            {recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map(payment => (
                  <div key={payment._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 flex-shrink-0">
                      <CreditCard size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate mb-0.5">
                        {payment.course.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-500 flex items-center gap-1 font-medium">
                        <Clock size={10} /> {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </p>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${
                        payment.status === 'approved' ? 'text-green-500' : payment.status === 'rejected' ? 'text-red-500' : 'text-amber-500'
                      }`}>
                        {payment.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-neutral-400 text-center py-4">No payments yet.</p>
            )}
          </div>

        </div>
      </div>

      {/* Assignment Submit Modal */}
      <StudentAssignmentModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        assignment={selectedTask?.assignment ?? null}
        enrollmentId={selectedTask?.enrollmentId ?? ''}
        onSubmitted={() => {
          setSubmitModalOpen(false)
          setAssignments(prev => prev.map(a =>
            a._id === selectedTask?.assignment._id
              ? { ...a, submissions: [{ _id: 'temp', student: { _id: '', name: '' }, enrollment: selectedTask?.enrollmentId ?? '', submittedAt: new Date().toISOString(), fileUrl: '', status: 'submitted' as const }] }
              : a
          ))
        }}
      />

      {selectedPayEnrollment && (() => {
        const originalPrice = selectedPayEnrollment.course.currency === 'USD' ? (selectedPayEnrollment.course.priceUSD ?? 0) : (selectedPayEnrollment.course.price ?? 0)
        const savedDiscount = (selectedPayEnrollment.discountApplied || 0) + (selectedPayEnrollment.offerDiscountApplied || 0)
        const hasSavedDiscount = savedDiscount > 0
        const discountedPrice = hasSavedDiscount ? Math.max(0, originalPrice - savedDiscount) : undefined
        
        return (
          <PaymentSubmitModal
            courseId={selectedPayEnrollment.course._id}
            teacherId={selectedPayEnrollment.teacher._id}
            courseName={selectedPayEnrollment.course.title}
            coursePrice={originalPrice}
            courseCurrency={selectedPayEnrollment.course.currency}
            pricingType={selectedPayEnrollment.course.pricingType}
            offerDiscountedPrice={discountedPrice}
            offerLabel={hasSavedDiscount ? 'Discount' : undefined}
            hasSavedDiscount={hasSavedDiscount}
            isOpen={true}
            onClose={() => setSelectedPayEnrollment(null)}
            onSuccess={() => {
              setSelectedPayEnrollment(null)
              setEnrollments(prev => prev.map(e =>
                e._id === selectedPayEnrollment._id
                  ? { ...e, payment: { ...e.payment, status: 'pending' } as any }
                  : e
              ))
            }}
          />
        )
      })()}
    </div>
  )
}
