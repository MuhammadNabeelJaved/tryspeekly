import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Handshake, Clock, CheckCircle, XCircle, X, SpinnerGap,
  BookOpen, CalendarBlank, MagnifyingGlass, Warning, ArrowRight, CaretDown, CaretUp,
} from '@phosphor-icons/react'
import { financialAidService } from '@/services/financial-aid.service'
import { enrollmentsService } from '@/services/enrollments.service'
import { coursesService } from '@/services/courses.service'
import { useAuth } from '@/context/AuthContext'
import type { FinancialAid, Enrollment, Course } from '@/types/api'

function StatusBadge({ status }: { status: FinancialAid['status'] }) {
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
      <Clock size={12} weight="fill" /> Pending
    </span>
  )
  if (status === 'under_review') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
      <MagnifyingGlass size={12} weight="fill" /> Under Review
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
  defaultPhone: string
}

function ApplyModal({ onClose, onSuccess, defaultName, defaultEmail, defaultPhone }: ApplyModalProps) {
  const [name, setName] = useState(defaultName)
  const [email, setEmail] = useState(defaultEmail)
  const [phone, setPhone] = useState(defaultPhone)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Course selection (optional)
  const [courses, setCourses] = useState<Course[]>([])
  const [courseSearch, setCourseSearch] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [showCourseList, setShowCourseList] = useState(false)

  useEffect(() => {
    coursesService.getAllCourses({ status: 'published', limit: 200 })
      .then(res => setCourses(res.data))
      .catch(() => {})
  }, [])

  const filteredCourses = courses.filter(c =>
    !courseSearch.trim() || c.title.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const selectedCourse = courses.find(c => c._id === selectedCourseId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) { setError('Please provide a phone number so we can contact you.'); return }
    if (!reason.trim()) { setError('Please provide a reason for your application.'); return }
    setError('')
    setSubmitting(true)
    try {
      await financialAidService.apply({ name, email, phone, reason, courseId: selectedCourseId || undefined })
      onSuccess()
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to submit application. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
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

        {/* Scrollable body + footer wrapped in form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-4">
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
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Phone <span className="text-red-500">*</span></label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="+92 300 0000000" required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 mb-1.5">Reason for Application <span className="text-red-500">*</span></label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3}
                placeholder="Explain why you need financial aid and how it will help you..."
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 resize-none" />
            </div>

            {/* Optional course selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Preferred Course <span className="text-slate-400 dark:text-neutral-500 font-normal">(optional)</span>
                </label>
                {selectedCourse && (
                  <button type="button" onClick={() => { setSelectedCourseId(''); setCourseSearch('') }}
                    className="text-[10px] text-red-500 hover:text-red-600 font-semibold">
                    Clear
                  </button>
                )}
              </div>

              {selectedCourse ? (
                <div className="flex items-center justify-between px-3 py-2.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-300">{selectedCourse.title}</p>
                    <p className="text-[10px] text-violet-500 dark:text-violet-400 capitalize mt-0.5">
                      {selectedCourse.level} · {selectedCourse.type} · {selectedCourse.totalSessions} sessions
                    </p>
                  </div>
                  <CheckCircle size={16} weight="fill" className="text-violet-500 flex-shrink-0" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowCourseList(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-slate-500 dark:text-neutral-400 hover:border-violet-400 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={14} /> Select a specific course (admin can also choose for you)
                  </span>
                  {showCourseList ? <CaretUp size={13} /> : <CaretDown size={13} />}
                </button>
              )}

              {showCourseList && !selectedCourse && (
                <div className="mt-1.5 border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                  <div className="p-2 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                    <div className="relative">
                      <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={courseSearch}
                        onChange={e => setCourseSearch(e.target.value)}
                        placeholder="Search courses…"
                        className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-900 dark:text-white outline-none focus:border-violet-500"
                      />
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-50 dark:divide-neutral-800">
                    {filteredCourses.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No courses found</p>
                    ) : filteredCourses.map(c => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => { setSelectedCourseId(c._id); setShowCourseList(false); setCourseSearch('') }}
                        className="w-full text-left px-3 py-2.5 text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors bg-white dark:bg-neutral-900"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white leading-tight">{c.title}</p>
                        <p className="text-[10px] text-slate-400 capitalize mt-0.5">{c.level} · {c.type} · {c.totalSessions} sessions</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1.5">
                Selecting a course is optional. If you skip, the admin will assign a suitable course upon approval.
              </p>
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{error}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
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
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [aidRes, enrollRes] = await Promise.allSettled([
      financialAidService.getMyApplications(),
      enrollmentsService.getMyEnrollments(),
    ])
    if (aidRes.status === 'fulfilled') setApplications(aidRes.value.data)
    if (enrollRes.status === 'fulfilled') setEnrollments(enrollRes.value.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSuccess = () => {
    setShowModal(false)
    fetchData()
  }

  // Find the enrollment linked to a specific financial aid application
  const getLinkedEnrollment = (aidId: string): Enrollment | undefined =>
    enrollments.find(e => e.financialAid?._id === aidId)

  const statusOrder: Record<FinancialAid['status'], number> = {
    accepted: 0, under_review: 1, pending: 2, rejected: 3,
  }
  const sorted = [...applications].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Financial Aid</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Track your financial aid applications and enrollment access.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors">
          Apply for Aid
        </button>
      </div>

      {/* Cards */}
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
        ) : sorted.length === 0 ? (
          <div className="col-span-2 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-neutral-700">
            <Handshake size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No Financial Aid Applications</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">You haven't applied for any financial aid yet.</p>
          </div>
        ) : (
          sorted.map((aid, index) => {
            const linked = getLinkedEnrollment(aid._id)
            return (
              <motion.div key={aid._id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm overflow-hidden ${
                  aid.status === 'accepted' ? 'border-green-200 dark:border-green-800/40' :
                  aid.status === 'rejected' ? 'border-red-200 dark:border-red-800/40' :
                  'border-slate-200 dark:border-neutral-800'
                }`}>

                {/* Card header */}
                <div className={`px-5 pt-5 pb-4 ${aid.status === 'accepted' ? 'bg-green-50/50 dark:bg-green-900/5' : aid.status === 'rejected' ? 'bg-red-50/50 dark:bg-red-900/5' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      aid.status === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                      aid.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' :
                      'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {aid.status === 'accepted' ? <CheckCircle size={20} weight="fill" /> :
                       aid.status === 'rejected' ? <Warning size={20} weight="fill" /> :
                       <Handshake size={20} weight="fill" />}
                    </div>
                    <StatusBadge status={aid.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white mb-0.5">
                    {aid.course?.title ?? 'General Financial Aid'}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <CalendarBlank size={11} /> Applied {new Date(aid.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {aid.decidedAt && ` · Decision: ${new Date(aid.decidedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  </p>
                </div>

                <div className="px-5 pb-5 space-y-3">
                  {/* Reason */}
                  <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mb-1">Your Reason</p>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 italic">"{aid.reason}"</p>
                  </div>

                  {/* Admin notes (only for non-rejected — rejected shows reason in its own block) */}
                  {aid.notes && aid.status !== 'rejected' && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20">
                      <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Admin Notes</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">{aid.notes}</p>
                    </div>
                  )}

                  {/* Approved amount */}
                  {aid.approvedAmount != null && (
                    <div className="flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                      <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Approved Amount</span>
                      <span className="text-sm font-black text-green-700 dark:text-green-300">PKR {aid.approvedAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Enrollment info for accepted applications */}
                  {aid.status === 'accepted' && (
                    linked ? (
                      <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40 rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <BookOpen size={14} weight="fill" className="text-violet-600 dark:text-violet-400" />
                          <p className="text-xs font-black text-violet-700 dark:text-violet-300 uppercase tracking-wide">Enrolled — Free Access</p>
                          <span className="ml-auto text-[9px] font-bold bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full uppercase">Active</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{linked.course?.title ?? '—'}</p>
                        {linked.teacher && (
                          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                            Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-200">{linked.teacher.name}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1"><CalendarBlank size={11} /> Enrolled {new Date(linked.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          <span>·</span>
                          <span>{linked.progress.sessionsAttended}/{linked.progress.totalSessions} sessions</span>
                        </div>
                        <Link
                          to={`/dashboard/courses/${linked.course._id}`}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
                        >
                          <BookOpen size={14} weight="fill" />
                          Access Course
                          <ArrowRight size={12} weight="bold" />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3">
                        <Clock size={14} className="text-amber-500 flex-shrink-0" />
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Application approved — waiting for admin to enroll you in a course.</p>
                      </div>
                    )
                  )}

                  {/* Rejected message */}
                  {aid.status === 'rejected' && (
                    <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                      <XCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-600 dark:text-red-300">
                          Your application was not approved this time.
                        </p>
                        {aid.notes && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 bg-red-100 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg">
                            <span className="font-bold">Reason: </span>{aid.notes}
                          </p>
                        )}
                        <p className="text-xs text-red-500/70 dark:text-red-400/70 mt-1">You can apply again or contact support.</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <ApplyModal
            onClose={() => setShowModal(false)}
            onSuccess={handleSuccess}
            defaultName={user?.name ?? ''}
            defaultEmail={user?.email ?? ''}
            defaultPhone={user?.phone ?? ''}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
