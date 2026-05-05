import { MOCK_INSTRUCTOR, INSTRUCTOR_COURSES, RECENT_ASSIGNMENTS } from './instructorData'
import { BookOpen, Users, Star, CurrencyDollar, ArrowRight } from '@phosphor-icons/react'
import type { InstructorView } from '../InstructorDashboardPage'

export default function InstructorOverview({ onNavigate }: { onNavigate: (view: InstructorView) => void }) {
  const activeCourses = INSTRUCTOR_COURSES.filter(c => c.status === 'active')

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Users size={20} weight="fill" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-neutral-400">Total Students</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{MOCK_INSTRUCTOR.studentsCount}</p>
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
              <p className="text-2xl font-black text-slate-900 dark:text-white">{MOCK_INSTRUCTOR.coursesCount}</p>
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
              <p className="text-2xl font-black text-slate-900 dark:text-white">{MOCK_INSTRUCTOR.rating}</p>
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
              <p className="text-2xl font-black text-slate-900 dark:text-white">${MOCK_INSTRUCTOR.earnings}</p>
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
            {activeCourses.slice(0, 4).map(course => (
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
            ))}
          </div>
        </div>

        {/* Recent Assignments / Needs Attention */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Assignments</h2>
          </div>
          
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {RECENT_ASSIGNMENTS.map(assignment => (
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
              ))}
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