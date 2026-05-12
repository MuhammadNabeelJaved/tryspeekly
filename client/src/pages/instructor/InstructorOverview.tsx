import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { coursesService } from '../../services/courses.service'
import { paymentsService } from '../../services/payments.service'
import { MOCK_INSTRUCTOR as FALLBACK_INSTRUCTOR, INSTRUCTOR_COURSES as FALLBACK_COURSES, RECENT_ASSIGNMENTS as FALLBACK_ASSIGNMENTS } from './instructorData'
import { BookOpen, Users, Star, CurrencyDollar, ArrowRight, MagnifyingGlass, X } from '@phosphor-icons/react'
import type { InstructorView } from '../InstructorDashboardPage'

export default function InstructorOverview({ onNavigate }: { onNavigate: (view: InstructorView) => void }) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [instructor, setInstructor] = useState(FALLBACK_INSTRUCTOR)
  const [courses, setCourses] = useState(FALLBACK_COURSES)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, earningsRes] = await Promise.allSettled([
          coursesService.getTeacherCourses(),
          paymentsService.getEarnings(),
        ])

        if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
          const mapped = coursesRes.value.data.map((c) => ({
            id: c._id,
            title: c.title,
            students: c.enrolledStudents?.length || 0,
            status: c.status === 'published' ? 'active' : c.status === 'archived' ? 'draft' : c.status,
            nextClass: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}` : 'TBD',
            progress: 0,
          }))
          if (mapped.length > 0) setCourses(mapped)
        }

        if (earningsRes.status === 'fulfilled' && earningsRes.value.success) {
          setInstructor((prev) => ({ ...prev, earnings: earningsRes.value.data.totalEarnings ?? prev.earnings }))
        }
      } catch {
        // Fallback to mock data on error
      }
    }
    fetchData()
  }, [])

  const displayName = user?.name || FALLBACK_INSTRUCTOR.name

  const activeCourses = courses.filter((c) =>
    c.status === 'active' &&
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredAssignments = FALLBACK_ASSIGNMENTS.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.course.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0) || FALLBACK_INSTRUCTOR.studentsCount
  const activeCount = courses.filter((c) => c.status === 'active').length || FALLBACK_INSTRUCTOR.coursesCount

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back, {displayName}!</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Here's what's happening with your courses and students today.</p>
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
            placeholder="Search courses or assignments..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Users size={20} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">Total Students</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BookOpen size={20} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">Active Courses</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{activeCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star size={20} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">Avg Rating</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{instructor.rating}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
              <CurrencyDollar size={20} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">Monthly Earnings</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">${instructor.earnings}</p>
            </div>
          </div>
        </div>
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
                    <button className="text-xs font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-10 text-center bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-neutral-800">
                <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">No courses found matching your search.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Assignments / Needs Attention */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Assignments</h2>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map(assignment => (
                  <div key={assignment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{assignment.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2 truncate">{assignment.course}</p>
                    
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={`${assignment.submitted === assignment.total ? 'text-green-600' : 'text-amber-600'}`}>
                        {assignment.submitted} / {assignment.total} submitted
                      </span>
                      <span className="text-slate-400">Due {assignment.dueDate}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-neutral-500">
                  No assignments found.
                </div>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/50 text-center">
              <button className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:underline">
                Grade Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}