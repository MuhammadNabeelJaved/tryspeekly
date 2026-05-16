import { useState, useEffect } from 'react'
import { VideoCamera, CalendarBlank, FilePdf, ShieldCheck, ChatCircleDots } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { enrollmentsService } from '@/services/enrollments.service'
import type { Enrollment } from '@/types/api'
import InstructorChatModal from './InstructorChatModal'

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState({ name: '', courseTitle: '' })

  useEffect(() => {
    enrollmentsService.getMyEnrollments()
      .then(res => { if (res.success) setEnrollments(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openChat = (e: React.MouseEvent, instructorName: string, courseTitle: string) => {
    e.preventDefault()
    setSelectedInstructor({ name: instructorName, courseTitle })
    setChatModalOpen(true)
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
          <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Active Enrollments</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {enrollments.map(enrollment => {
              const attended = enrollment.progress?.sessionsAttended ?? 0
              const total = enrollment.progress?.totalSessions ?? 0
              const attendance = total > 0 ? Math.round((attended / total) * 100) : 0

              return (
                <Link
                  to={`/dashboard/courses/${enrollment.course._id}`}
                  key={enrollment._id}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors group"
                >
                  {/* Info Section */}
                  <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-neutral-800">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-md uppercase tracking-wide">
                        Enrolled
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                        <ShieldCheck size={14} weight="fill" />
                        {attendance}% Attendance ({enrollment.progress?.sessionsAttended ?? 0}/{enrollment.progress?.totalSessions ?? 0})
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 transition-colors">
                      {enrollment.course.title}
                    </h4>

                    <div className="flex items-center justify-between mb-5">
                      <p className="text-sm text-slate-500 dark:text-neutral-400">
                        Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-300">{enrollment.teacher?.name ?? '—'}</span>
                      </p>
                      <button
                        onClick={(e) => openChat(e, enrollment.teacher?.name ?? '—', enrollment.course.title)}
                        className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <ChatCircleDots size={16} weight="fill" />
                        Chat
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800 p-3 rounded-xl border border-slate-100 dark:border-neutral-700">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500 shadow-sm">
                          <CalendarBlank size={16} weight="fill" />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Sessions</p>
                          <p>{enrollment.progress?.sessionsAttended ?? 0} of {enrollment.progress?.totalSessions ?? 0} completed</p>
                        </div>
                      </div>

                      <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                        <FilePdf size={18} />
                        Class Materials & Notes
                      </button>
                    </div>
                  </div>

                  {/* Go to Course Section */}
                  <div className="p-6 md:w-64 bg-slate-50 dark:bg-neutral-900/50 flex flex-col justify-center">
                    <div className="text-center mb-5">
                      <div className="w-12 h-12 mx-auto rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 mb-3">
                        <VideoCamera size={24} weight="fill" />
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Your Progress</p>
                      <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{attendance}%</p>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">attendance rate</p>
                    </div>

                    <Link
                      to={`/dashboard/courses/${enrollment.course._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)]"
                    >
                      View Course Details
                    </Link>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Instructor Chat Modal */}
      <InstructorChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        instructorName={selectedInstructor.name}
        courseTitle={selectedInstructor.courseTitle}
      />
    </div>
  )
}
