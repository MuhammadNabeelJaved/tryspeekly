import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass, Eye, FunnelSimple, Handshake, X, SpinnerGap,
  BookOpen, CheckCircle, CalendarBlank, User, Clock, XCircle,
} from '@phosphor-icons/react'
import { financialAidService } from '@/services/financial-aid.service'
import { enrollmentsService } from '@/services/enrollments.service'
import { coursesService } from '@/services/courses.service'
import { usersService } from '@/services/users.service'
import type { FinancialAid, Course, Enrollment, User as UserType } from '@/types/api'

function Badge({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    accepted: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>{value.replace('_', ' ')}</span>
}

type StatusValue = FinancialAid['status']

export default function AdminFinancialAid() {
  const [applications, setApplications] = useState<FinancialAid[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [modal, setModal] = useState<FinancialAid | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Rejection reason states
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Course enrollment states
  const [courses, setCourses] = useState<Course[]>([])
  const [courseSearch, setCourseSearch] = useState('')
  const [courseLevel, setCourseLevel] = useState('all')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollSuccess, setEnrollSuccess] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [existingEnrollment, setExistingEnrollment] = useState<Enrollment | null>(null)
  const [checkingEnrollment, setCheckingEnrollment] = useState(false)

  // Student lookup states (for public applications without linked student)
  const [studentSearchQuery, setStudentSearchQuery] = useState('')
  const [foundStudents, setFoundStudents] = useState<UserType[]>([])
  const [searchingStudent, setSearchingStudent] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const fetchApplications = useCallback(() => {
    setLoading(true)
    financialAidService.getAllApplications({ limit: 100 })
      .then(res => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  useEffect(() => {
    coursesService.getAllCourses({ status: 'published', limit: 200 })
      .then(res => setCourses(res.data))
      .catch(() => {})
  }, [])

  const filtered = applications.filter(app => {
    const q = search.toLowerCase()
    const matchSearch = !q || app.name.toLowerCase().includes(q) || app.email.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || app.status === filterStatus
    return matchSearch && matchStatus
  }).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())

  const filteredCourses = courses.filter(c => {
    const q = courseSearch.toLowerCase()
    return (!q || c.title.toLowerCase().includes(q)) && (courseLevel === 'all' || c.level === courseLevel)
  })

  const openModal = async (app: FinancialAid) => {
    setModal(app)
    setSelectedCourseId(app.course?._id ?? '')
    setEnrollSuccess(false)
    setEnrollError('')
    setExistingEnrollment(null)
    setShowRejectInput(false)
    setRejectReason('')
    setCourseSearch('')
    setCourseLevel('all')
    setStudentSearchQuery('')
    setFoundStudents([])
    setSelectedStudentId('')

    if (app.status === 'accepted') {
      setCheckingEnrollment(true)
      try {
        const res = await enrollmentsService.getEnrollmentByFinancialAid(app._id)
        setExistingEnrollment(res.data)
      } catch {
        setExistingEnrollment(null)
      } finally {
        setCheckingEnrollment(false)
      }
    }
  }

  const searchStudents = async () => {
    if (!studentSearchQuery.trim()) return
    setSearchingStudent(true)
    try {
      const res = await usersService.getAllUsers({ role: 'student', search: studentSearchQuery, limit: 5 })
      setFoundStudents(res.data)
    } catch {
      setFoundStudents([])
    } finally {
      setSearchingStudent(false)
    }
  }

  const handleEnroll = async () => {
    const studentId = modal?.student?._id || selectedStudentId
    if (!studentId || !selectedCourseId) return
    setEnrolling(true)
    setEnrollError('')
    try {
      const res = await enrollmentsService.adminEnrollWithFinancialAid({
        financialAidId: modal!._id,
        courseId: selectedCourseId,
        studentId: modal?.student ? undefined : selectedStudentId,
      })
      setExistingEnrollment(res.data)
      setEnrollSuccess(true)
    } catch (err: any) {
      setEnrollError(err?.response?.data?.error?.message || 'Enrollment failed. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const updateStatus = async (id: string, newStatus: StatusValue, notes?: string) => {
    setUpdatingStatus(true)
    try {
      await financialAidService.updateStatus(id, newStatus, notes)
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status: newStatus, notes } : a))
      setModal(prev => prev?._id === id ? { ...prev, status: newStatus, notes } : prev)
      setEnrollSuccess(false)
      setEnrollError('')
      setExistingEnrollment(null)
      setShowRejectInput(false)
      setRejectReason('')
    } catch {
      // silent fail
    } finally {
      setUpdatingStatus(false)
    }
  }

  const confirmReject = () => {
    if (!modal) return
    updateStatus(modal._id, 'rejected', rejectReason.trim() || undefined)
  }

  const handleStatusClick = (s: StatusValue) => {
    if (!modal) return
    if (s === 'rejected') {
      setShowRejectInput(true)
      setRejectReason('')
      return
    }
    updateStatus(modal._id, s)
  }

  return (
    <div className="p-4 sm:p-6 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Financial Aid <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">({filtered.length})</span></h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage financial aid applications</p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-violet-600 text-white border-violet-600' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:border-violet-300'}`}>
          <FunnelSimple size={15} /> Filters
        </button>
      </div>

      <div className="relative mb-3">
        <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                  {['All', 'pending', 'under_review', 'accepted', 'rejected'].map(v => (
                    <option key={v} value={v}>{v.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                {['Applicant', 'Phone', 'Date Applied', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No applications found</td></tr>
              ) : (
                filtered.map(app => (
                  <tr key={app._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {app.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">{app.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[140px]">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{app.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div>
                        <Badge value={app.status} />
                        {app.status === 'rejected' && app.notes && (
                          <p className="text-[9px] text-red-400 mt-0.5 max-w-[140px] truncate" title={app.notes}>{app.notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(app)}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors">
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW / REVIEW MODAL */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-lg border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Handshake size={18} className="text-emerald-500" /> Financial Aid Details
                </h3>
                <button onClick={() => setModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[72vh]">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-neutral-800">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-black shadow-lg">
                    {modal.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">{modal.name}</h4>
                    <p className="text-sm text-slate-500 dark:text-neutral-400">{modal.email}{modal.phone ? ` · ${modal.phone}` : ''}</p>
                    <div className="mt-1.5"><Badge value={modal.status} /></div>
                  </div>
                </div>

                <div className="space-y-5">
                  {modal.course && (
                    <div>
                      <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Course Applied For</h5>
                      <p className="text-sm text-slate-700 dark:text-neutral-300 font-medium">{modal.course.title}</p>
                    </div>
                  )}

                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Reason</h5>
                    <p className="text-sm text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/60 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {modal.reason}
                    </p>
                  </div>

                  {modal.notes && (
                    <div className={`p-3 rounded-xl border ${modal.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/40' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'}`}>
                      <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${modal.status === 'rejected' ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {modal.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                      </h5>
                      <p className={`text-xs ${modal.status === 'rejected' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>{modal.notes}</p>
                    </div>
                  )}

                  {/* ── Update Status ── */}
                  <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                    <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-3">Update Status</h5>

                    {showRejectInput ? (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <XCircle size={13} weight="fill" /> Rejection Reason
                        </p>
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Explain why this application is being rejected (optional but recommended)…"
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-950/10 text-sm text-slate-900 dark:text-white outline-none focus:border-red-400 resize-none placeholder-red-300 dark:placeholder-red-800/60"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={confirmReject}
                            disabled={updatingStatus}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            {updatingStatus ? <SpinnerGap size={13} className="animate-spin" /> : <XCircle size={13} weight="fill" />}
                            Confirm Rejection
                          </button>
                          <button
                            onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {(['under_review', 'accepted', 'rejected', 'pending'] as const).map(s => (
                          <button key={s} disabled={updatingStatus || modal.status === s}
                            onClick={() => handleStatusClick(s)}
                            className={`py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${modal.status === s
                              ? s === 'accepted' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : s === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : s === 'under_review' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 disabled:opacity-50'}`}>
                            {updatingStatus ? <SpinnerGap size={12} className="animate-spin" /> : null}
                            {s.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Course Enrollment (accepted) ── */}
                  {modal.status === 'accepted' && (
                    <div className="pt-4 border-t border-slate-100 dark:border-neutral-800">
                      <h5 className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <BookOpen size={12} /> Course Enrollment (Free Access)
                      </h5>

                      {checkingEnrollment ? (
                        <div className="flex items-center gap-2 py-3 text-slate-400 dark:text-neutral-500 text-xs">
                          <SpinnerGap size={14} className="animate-spin" /> Checking enrollment…
                        </div>
                      ) : existingEnrollment ? (
                        <div className="space-y-2">
                          {enrollSuccess && (
                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl px-3 py-2.5">
                              <CheckCircle size={15} weight="fill" className="text-emerald-500 flex-shrink-0" />
                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Student enrolled successfully with free access!</p>
                            </div>
                          )}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-4 space-y-2.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Enrolled — Free Access Active</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="bg-white dark:bg-neutral-800/60 rounded-lg p-2.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Course</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{existingEnrollment.course.title}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/60 rounded-lg p-2.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Student</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{existingEnrollment.student.name}</p>
                              <p className="text-[9px] text-slate-400 truncate">{existingEnrollment.student.email}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/60 rounded-lg p-2.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Instructor</p>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{existingEnrollment.teacher.name}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800/60 rounded-lg p-2.5">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">Sessions</p>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                                {existingEnrollment.progress.sessionsAttended} / {existingEnrollment.progress.totalSessions}
                              </p>
                            </div>
                          </div>
                        </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Enrolling info */}
                          {modal.student ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-neutral-400">
                              <User size={13} weight="fill" />
                              <span>Enrolling: <span className="font-bold text-slate-800 dark:text-neutral-200">{modal.student.name}</span> ({modal.student.email})</span>
                            </div>
                          ) : (
                            /* Public application — student lookup */
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3 space-y-2.5">
                              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                                No linked account. Search by email to find this applicant's student account.
                              </p>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">Applicant email: <span className="font-bold">{modal.email}</span></p>
                              <div className="flex gap-1.5">
                                <input
                                  value={studentSearchQuery}
                                  onChange={e => setStudentSearchQuery(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && searchStudents()}
                                  placeholder={modal.email}
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white outline-none focus:border-violet-500"
                                />
                                <button
                                  onClick={searchStudents}
                                  disabled={searchingStudent}
                                  className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold flex items-center gap-1 disabled:opacity-50"
                                >
                                  {searchingStudent ? <SpinnerGap size={11} className="animate-spin" /> : <MagnifyingGlass size={11} />}
                                  Search
                                </button>
                              </div>
                              {foundStudents.length > 0 && (
                                <div className="space-y-1">
                                  {foundStudents.map(s => (
                                    <button
                                      key={s._id}
                                      type="button"
                                      onClick={() => setSelectedStudentId(s._id!)}
                                      className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                                        selectedStudentId === s._id
                                          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700'
                                          : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 hover:border-violet-300'
                                      }`}
                                    >
                                      <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                                      <p className="text-[10px] text-slate-400">{s.email}</p>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {foundStudents.length === 0 && studentSearchQuery && !searchingStudent && (
                                <p className="text-[10px] text-slate-400">No students found. Ask them to register first.</p>
                              )}
                            </div>
                          )}

                          {/* Student's requested course hint */}
                          {modal.course && (
                            <div className="flex items-start gap-2 bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/40 rounded-xl px-3 py-2.5">
                              <BookOpen size={13} weight="fill" className="text-violet-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide">Student Requested</p>
                                <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">{modal.course.title}</p>
                                <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5">Pre-selected below — you can change it if needed.</p>
                              </div>
                            </div>
                          )}

                          {/* Course search + filter */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Select Course</p>
                            <div className="flex gap-1.5">
                              <div className="relative flex-1">
                                <MagnifyingGlass size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  value={courseSearch}
                                  onChange={e => setCourseSearch(e.target.value)}
                                  placeholder="Search courses…"
                                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white outline-none focus:border-violet-500"
                                />
                              </div>
                              <select
                                value={courseLevel}
                                onChange={e => setCourseLevel(e.target.value)}
                                className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500"
                              >
                                <option value="all">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            </div>

                            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 dark:border-neutral-700 divide-y divide-slate-100 dark:divide-neutral-700/50">
                              {filteredCourses.length === 0 ? (
                                <p className="text-[11px] text-slate-400 text-center py-4">No courses match your search</p>
                              ) : filteredCourses.map(c => (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => setSelectedCourseId(c._id)}
                                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                                    selectedCourseId === c._id
                                      ? 'bg-violet-50 dark:bg-violet-900/20'
                                      : 'bg-white dark:bg-neutral-800/30 hover:bg-slate-50 dark:hover:bg-neutral-700/30'
                                  }`}
                                >
                                  <p className={`font-semibold leading-tight ${selectedCourseId === c._id ? 'text-violet-700 dark:text-violet-300' : 'text-slate-900 dark:text-white'}`}>
                                    {c.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 capitalize mt-0.5">
                                    {c.level} · {c.type} · {c.totalSessions} sessions
                                  </p>
                                </button>
                              ))}
                            </div>

                            {selectedCourseId && (
                              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
                                <CheckCircle size={11} weight="fill" />
                                {courses.find(c => c._id === selectedCourseId)?.title}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={handleEnroll}
                            disabled={enrolling || !selectedCourseId || (!modal.student && !selectedStudentId)}
                            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            {enrolling ? <SpinnerGap size={14} className="animate-spin" /> : <BookOpen size={14} weight="bold" />}
                            Enroll in Course Free
                          </button>

                          {enrollError && (
                            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl px-3 py-2.5">
                              <XCircle size={14} weight="fill" className="text-red-500 flex-shrink-0" />
                              <p className="text-xs font-semibold text-red-600 dark:text-red-400">{enrollError}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-slate-100 dark:border-neutral-800">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 text-sm font-bold transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
