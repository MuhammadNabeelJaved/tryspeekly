import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  VideoCamera,
  CalendarBlank,
  ShieldCheck,
  Clock,
  CheckCircle,
  ChatCircleDots,
  Spinner,
  ClipboardText,
  Star,
  FilePdf,
  PresentationChart,
  ShareNetwork,
  Check,
  Medal,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'

import { enrollmentsService } from '@/services/enrollments.service'
import { coursesService } from '@/services/courses.service'
import { assignmentsService } from '@/services/assignments.service'
import { certificatesService } from '@/services/certificates.service'
import type { Enrollment, Course, Assignment, CourseMaterial, SyllabusTopic } from '@/types/api'
import StudentAssignmentModal from './StudentAssignmentModal'
import InstructorChatModal from './InstructorChatModal'

type ActiveTab = 'overview' | 'assignments' | 'materials' | 'syllabus'

export default function StudentCourseDetails() {
  const { id: courseId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false)
  const [syllabus, setSyllabus] = useState<SyllabusTopic[]>([])
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  // ─── Fetch enrollment + course ─────────────────────────────────────────────
  useEffect(() => {
    if (!courseId) return

    async function fetchData() {
      setLoading(true)
      try {
        const [enrollRes, courseRes] = await Promise.all([
          enrollmentsService.getMyEnrollments(),
          coursesService.getCourseById(courseId!),
        ])

        if (enrollRes.success) {
          const found = enrollRes.data.find((e) => e.course._id === courseId) ?? null
          if (found && !found.isActive) {
            navigate('/dashboard/courses', { replace: true })
            return
          }
          setEnrollment(found)
        }

        if (courseRes.success) {
          setCourse(courseRes.data)
        }
      } catch {
        toast.error('Failed to load course details.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [courseId])

  // ─── Lazy-load assignments when Assignments tab is active ──────────────────
  useEffect(() => {
    if (activeTab !== 'assignments' || !courseId) return

    async function fetchAssignments() {
      try {
        const res = await assignmentsService.getCourseAssignments(courseId!)
        if (res.success) {
          setAssignments(res.data)
        }
      } catch {
        toast.error('Failed to load assignments.')
      }
    }

    fetchAssignments()
  }, [courseId, activeTab])

  // ─── Lazy-load materials when Materials tab is active ──────────────────────
  useEffect(() => {
    if (activeTab !== 'materials' || !courseId) return
    setIsLoadingMaterials(true)
    coursesService.getMaterials(courseId)
      .then((res) => { if (res.success) setMaterials(res.data as unknown as CourseMaterial[]) })
      .catch(() => toast.error('Failed to load materials.'))
      .finally(() => setIsLoadingMaterials(false))
  }, [courseId, activeTab])

  // ─── Lazy-load syllabus when Syllabus tab is active ────────────────────────
  useEffect(() => {
    if (activeTab !== 'syllabus' || !courseId) return
    setIsLoadingSyllabus(true)
    coursesService.getSyllabus(courseId)
      .then((res) => { if (res.success) setSyllabus(res.data as unknown as SyllabusTopic[]) })
      .catch(() => toast.error('Failed to load syllabus.'))
      .finally(() => setIsLoadingSyllabus(false))
  }, [courseId, activeTab])

  // ─── Refresh assignments after submission ──────────────────────────────────
  async function refreshAssignments() {
    if (!courseId) return
    try {
      const res = await assignmentsService.getCourseAssignments(courseId)
      if (res.success) {
        setAssignments(res.data)
      }
    } catch {
      // silently fail — onSubmitted is a best-effort refresh
    }
  }

  // ─── Claim certificate ─────────────────────────────────────────────────────
  async function handleClaimCertificate() {
    if (!enrollment) return
    setIsClaiming(true)
    try {
      const res = await certificatesService.claimCertificate(enrollment._id)
      if (res.success) {
        navigate(`/certificate/${res.data.certificateId}`)
      }
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { data?: { certificateId?: string } } } }
      if (axErr?.response?.status === 409 && axErr.response.data?.data?.certificateId) {
        navigate(`/certificate/${axErr.response.data.data.certificateId}`)
      } else {
        toast.error('Failed to claim certificate. Please try again.')
      }
    } finally {
      setIsClaiming(false)
    }
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center gap-3 text-slate-400 dark:text-neutral-500">
          <Spinner size={20} className="animate-spin" />
          <span className="text-sm font-semibold">Loading course details…</span>
        </div>
        <div className="h-10 w-48 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-40 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  // ─── Not found / not enrolled ─────────────────────────────────────────────
  if (!course || !enrollment) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Course Not Found
        </h2>
        <p className="text-slate-500 dark:text-neutral-400 mb-6">
          The course you are looking for does not exist or you are not enrolled.
        </p>
        <Link
          to="/dashboard/courses"
          className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold"
        >
          Go Back
        </Link>
      </div>
    )
  }

  // ─── Derived values ────────────────────────────────────────────────────────
  const sessionsAttended = enrollment.progress?.sessionsAttended ?? 0
  const totalSessions = enrollment.progress?.totalSessions ?? 0
  const attendancePct =
    totalSessions > 0 ? Math.round((sessionsAttended / totalSessions) * 100) : 0

  const instructorName = enrollment.teacher?.name ?? '—'
  const schedule = course.recurringSchedule?.[0]

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Link
          to="/dashboard/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md uppercase tracking-wide">
                {course.level}
              </span>
              <span className="text-[10px] font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md uppercase tracking-wide">
                {course.focus}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2">
              {course.title}
            </h1>
            <div className="flex items-center gap-4 text-slate-500 dark:text-neutral-400">
              <p>
                Instructor:{' '}
                <span className="font-bold text-slate-700 dark:text-neutral-300">
                  {instructorName}
                </span>
              </p>
              <button
                onClick={() => setChatModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-2 py-1 rounded transition-colors"
              >
                <ChatCircleDots size={16} weight="fill" /> Chat with Instructor
              </button>
            </div>
          </div>

          {course.meetLink && (
            <a
              href={course.meetLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)] whitespace-nowrap"
            >
              <VideoCamera size={20} weight="fill" />
              Join Next Class
            </a>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-fit flex-wrap">
        {(['overview', 'assignments', 'materials', 'syllabus'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Progress & Attendance Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Course Progress
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                        <CalendarBlank size={16} /> Classes
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {sessionsAttended} / {totalSessions}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-600 rounded-full"
                        style={{
                          width: `${totalSessions > 0 ? (sessionsAttended / totalSessions) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5">
                        <ShieldCheck size={16} /> Attendance
                      </span>
                      <span
                        className={`text-sm font-bold ${attendancePct >= 80 ? 'text-green-500' : 'text-amber-500'}`}
                      >
                        {attendancePct}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${attendancePct >= 80 ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${attendancePct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
            /* Assignments Tab */
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-amber-50/50 dark:bg-amber-900/5">
                <h3 className="font-bold text-slate-900 dark:text-white">Assignments</h3>
              </div>

              {assignments.length === 0 ? (
                <div className="p-10 text-center">
                  <ClipboardText
                    size={40}
                    className="mx-auto text-slate-300 dark:text-neutral-600 mb-3"
                  />
                  <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
                    No assignments yet for this course.
                  </p>
                </div>
              ) : (
                <div className="p-0 divide-y divide-slate-100 dark:divide-neutral-800">
                  {assignments.map((assignment) => {
                    const submission = assignment.submissions?.[0]
                    const isGraded = submission?.status === 'graded'
                    const isSubmitted = !!submission

                    return (
                      <div key={assignment._id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {assignment.title}
                              </p>
                              {isGraded && (
                                <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                                  <Star size={10} weight="fill" /> Graded
                                </span>
                              )}
                              {isSubmitted && !isGraded && (
                                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                                  Submitted
                                </span>
                              )}
                              {!isSubmitted && (
                                <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                              <Clock size={12} weight="bold" /> Due:{' '}
                              {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            {isGraded && submission?.grade !== undefined && (
                              <p className="text-xs text-green-600 dark:text-green-400 font-bold mt-1 flex items-center gap-1">
                                <CheckCircle size={12} weight="fill" /> Grade: {submission.grade}
                                /100
                              </p>
                            )}
                            {isGraded && submission?.feedback && (
                              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 italic line-clamp-2">
                                "{submission.feedback}"
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedAssignment(assignment)
                              setSubmitModalOpen(true)
                            }}
                            className="flex-shrink-0 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                          >
                            {isSubmitted ? 'Resubmit' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'materials' && (
            /* Materials Tab */
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-blue-50/50 dark:bg-blue-900/5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FilePdf size={18} weight="fill" className="text-blue-500" /> Course Materials
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Resources shared by your instructor</p>
              </div>

              {isLoadingMaterials ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : materials.length === 0 ? (
                <div className="p-10 text-center">
                  <FilePdf size={40} className="mx-auto text-slate-300 dark:text-neutral-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
                    No materials shared yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                    Your instructor will share resources here.
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material._id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/30 hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                          <FilePdf size={18} weight="fill" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{material.title}</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> {new Date(material.sharedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <a
                        href={material.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex-shrink-0"
                      >
                        <ShareNetwork size={14} /> Open
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'syllabus' && (
            /* Syllabus Tab */
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-violet-50/50 dark:bg-violet-900/5">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PresentationChart size={18} weight="fill" className="text-violet-500" /> Course Syllabus
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Weekly topics and progress</p>
              </div>

              {isLoadingSyllabus ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : syllabus.length === 0 ? (
                <div className="p-10 text-center">
                  <PresentationChart size={40} className="mx-auto text-slate-300 dark:text-neutral-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">
                    No syllabus topics added yet.
                  </p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">
                    Your instructor will add the course timeline here.
                  </p>
                </div>
              ) : (
                <div className="p-4">
                  <div className="relative pl-8 space-y-1 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-slate-100 dark:before:bg-neutral-800">
                    {syllabus.map((topic) => (
                      <div key={topic._id} className="relative pb-4 last:pb-0">
                        <div className={`absolute -left-8 top-5 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900 z-10 flex items-center justify-center ${
                          topic.status === 'completed' ? 'bg-green-500' : topic.status === 'in-progress' ? 'bg-violet-500' : 'bg-slate-200 dark:bg-neutral-700'
                        }`}>
                          {topic.status === 'completed' && <Check size={10} weight="bold" className="text-white" />}
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/30 ml-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1 block">Week {topic.week}</span>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">{topic.title}</h5>
                              {topic.description && (
                                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">{topic.description}</p>
                              )}
                            </div>
                            <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              topic.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              topic.status === 'in-progress' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' :
                              'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                              {topic.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Schedule */}
        <div className="space-y-6">
          {/* Certificate CTA — only when course is complete */}
          {totalSessions > 0 && sessionsAttended >= totalSessions && (
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 shadow-lg shadow-violet-600/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Medal size={22} weight="fill" className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Course Complete!</p>
                  <p className="text-violet-200 text-xs">You've earned your certificate</p>
                </div>
              </div>
              <button
                onClick={handleClaimCertificate}
                disabled={isClaiming}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-black py-2.5 rounded-xl transition-colors text-sm disabled:opacity-70 shadow-sm"
              >
                {isClaiming ? (
                  <><Spinner size={16} className="animate-spin" /> Claiming…</>
                ) : (
                  <><Medal size={16} weight="fill" /> Claim Certificate</>
                )}
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Schedule Details</h3>

            {schedule ? (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl border border-slate-100 dark:border-neutral-700">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500 shadow-sm flex-shrink-0">
                  <CalendarBlank size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-0.5">
                    Routine
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {schedule.day} at {schedule.time}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                No schedule set for this course yet.
              </p>
            )}

            {course.meetLink ? (
              <a
                href={course.meetLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)]"
              >
                <VideoCamera size={18} weight="fill" />
                Join Live Class
              </a>
            ) : (
              <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3">
                <VideoCamera size={16} className="text-slate-400 flex-shrink-0" />
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Live class link not set yet. Your instructor will add it soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Submit Modal */}
      <StudentAssignmentModal
        isOpen={submitModalOpen}
        onClose={() => {
          setSubmitModalOpen(false)
          setSelectedAssignment(null)
        }}
        assignment={selectedAssignment}
        enrollmentId={enrollment._id}
        onSubmitted={refreshAssignments}
      />

      {/* Instructor Chat Modal */}
      <InstructorChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        instructorName={instructorName}
        courseTitle={course.title}
      />
    </div>
  )
}
