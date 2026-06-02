import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { coursesService } from '@/services/courses.service'
import { enrollmentsService } from '@/services/enrollments.service'
import { reviewsService } from '@/services/reviews.service'
import { BookOpen, Users, ArrowRight, MagnifyingGlass, X, Star, Hourglass, Wallet } from '@phosphor-icons/react'
import ReviewModal from '@/components/ReviewModal'
import type { InstructorView } from '@/pages/InstructorDashboardPage'
import type { Review } from '@/types/api'

interface CourseItem {
  id: string
  title: string
  students: number
  status: string
  nextClass: string
  progress: number
}

interface InstructorOverviewProps {
  onNavigate: (view: InstructorView) => void
}

export default function InstructorOverview({ onNavigate }: InstructorOverviewProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [earnings, setEarnings] = useState(0)
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [existingPlatformReview, setExistingPlatformReview] = useState<Review | null>(null)

  async function handleWriteReview() {
    try {
      const res = await reviewsService.getMyReviews()
      if (res.success) {
        const platform = res.data.find((r) => r.type === 'platform') ?? null
        setExistingPlatformReview(platform)
      }
    } catch {
      setExistingPlatformReview(null)
    }
    setIsReviewModalOpen(true)
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [coursesRes, enrollmentsRes] = await Promise.allSettled([
          coursesService.getTeacherCourses(),
          enrollmentsService.getTeacherEnrollments(),
        ])

        // Build completed classes map from enrollments
        const completedMap: Record<string, number> = {}
        if (enrollmentsRes.status === 'fulfilled' && enrollmentsRes.value.success) {
          enrollmentsRes.value.data.forEach((enrollment) => {
            const courseId = enrollment.course?._id || (enrollment.course as unknown as string)
            const attended = enrollment.progress?.sessionsAttended ?? 0
            if (courseId) {
              const courseIdStr = courseId.toString().trim()
              completedMap[courseIdStr] = Math.max(completedMap[courseIdStr] ?? 0, attended)
            }
          })
        }

        if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
          const mapped = coursesRes.value.data.map((c) => {
            const courseIdStr = c._id.toString().trim()
            const completedCount = completedMap[courseIdStr] || 0
            const totalClasses = c.totalSessions || 0
            const progress = totalClasses > 0 ? Math.min(100, Math.round((completedCount / totalClasses) * 100)) : 0

            return {
              id: c._id,
              title: c.title,
              students: c.enrolledStudents?.length ?? 0,
              status: c.status === 'published' ? 'active' : c.status,
              nextClass: c.recurringSchedule?.[0]
                ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}`
                : '—',
              progress,
            }
          })
          setCourses(mapped)
        }
      } catch {
        // show zeros on error — no mock fallback
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const displayName = user?.name ?? '—'

  const activeCourses = courses.filter((c) =>
    c.status === 'active' &&
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0)
  const activeCount = courses.filter((c) => c.status === 'active').length
  const pendingCount = courses.filter((c) => c.status === 'pending').length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-neutral-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-52 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
              <div className="h-4 w-72 bg-slate-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-72 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt={displayName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-violet-500 shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-violet-500 shadow-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back, {displayName}!</h1>
            <p className="text-sm text-slate-500 dark:text-neutral-400">Here's what's happening with your courses and students today.</p>
          </div>
        </div>

        {/* Global Overview Search */}
        <div className="relative group w-full md:w-80">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: totalStudents, Icon: Users, accent: 'border-l-violet-500', tile: 'from-violet-500 to-purple-600', glow: 'rgba(124,58,237,0.3)' },
          { label: 'Active Courses', value: activeCount, Icon: BookOpen, accent: 'border-l-blue-500', tile: 'from-blue-500 to-blue-700', glow: 'rgba(59,130,246,0.3)' },
          { label: 'Pending Review', value: pendingCount, Icon: Hourglass, accent: 'border-l-amber-500', tile: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.3)' },
          { label: 'Total Earnings', value: `PKR ${earnings.toLocaleString()}`, Icon: Wallet, accent: 'border-l-emerald-500', tile: 'from-emerald-500 to-emerald-700', glow: 'rgba(16,185,129,0.3)' },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 border-l-4 ${s.accent} p-5 hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200`}
          >
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${s.tile} flex items-center justify-center mb-3`} style={{ boxShadow: `0 4px 12px ${s.glow}` }}>
              <s.Icon size={20} weight="fill" className="text-white" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{s.value}</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-neutral-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Courses */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Courses</h2>
            <button onClick={() => onNavigate('courses')} className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.length > 0 ? (
              activeCourses.slice(0, 4).map(course => (
                <div key={course.id} className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{course.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">{course.students} students enrolled</p>

                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-neutral-400">Course Progress</span>
                      <span className="text-violet-600 dark:text-violet-400">{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md">
                      Next: {course.nextClass}
                    </span>
                    <button onClick={() => onNavigate('courses')} className="text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-10 text-center bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
                <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">No active courses found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Assignments</h2>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500 dark:text-neutral-400 mb-4">
              View and grade student assignment submissions.
            </p>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mx-auto"
            >
              Go to Assignments <ArrowRight size={14} weight="bold" />
            </button>
          </div>

          {/* Share Your Experience */}
          <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <Star size={20} weight="fill" className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Share Your Experience</h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Help other teachers by sharing your feedback</p>
              </div>
            </div>
            <button
              onClick={handleWriteReview}
              className="w-full py-2.5 px-4 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors"
            >
              Write a Platform Review
            </button>
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        type="platform"
        existingReview={existingPlatformReview}
        onSuccess={(review) => setExistingPlatformReview(review)}
      />
    </div>
  )
}
