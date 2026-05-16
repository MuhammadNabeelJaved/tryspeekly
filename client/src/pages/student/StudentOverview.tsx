import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarBlank, CheckCircle, CreditCard, Clock, VideoCamera, HandWaving, Megaphone, ClipboardText, ChartLineUp, Certificate, ArrowRight } from '@phosphor-icons/react'
import { useAuth } from '../../context/AuthContext'
import { enrollmentsService } from '../../services/enrollments.service'
import { paymentsService } from '../../services/payments.service'
import { liveClassService } from '@/services/live-class.service'
import { MOCK_STUDENT, MOCK_ENROLLED_COURSES, MOCK_PAYMENTS, MOCK_ANNOUNCEMENTS, MOCK_ASSIGNMENTS } from './studentData'
import type { StudentView } from '../StudentDashboardPage'
import type { EnrolledCourse, PaymentRecord } from './studentData'
import type { Enrollment, Payment } from '../../types/api'
import StudentAssignmentModal from './StudentAssignmentModal'

type ActiveLiveClass = {
  _id: string
  course: {
    _id: string
    title: string
    totalSessions: number
  }
  teacher: {
    _id: string
    name: string
  }
  meetingLink: string
  classNumber: number
  createdAt: string
}

export default function StudentOverview({ onNavigate }: { onNavigate: (view: StudentView) => void }) {
  const activeCourses = MOCK_ENROLLED_COURSES.filter(c => c.status === 'active')
  const completedCourses = MOCK_ENROLLED_COURSES.filter(c => c.status === 'completed')
  const recentPayments = MOCK_PAYMENTS.slice(0, 3)
  const pendingAssignments = MOCK_ASSIGNMENTS.filter(a => a.status === 'pending')

  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{title: string, course: string} | null>(null)
  const [activeLiveClass, setActiveLiveClass] = useState<ActiveLiveClass | null>(null)
  const [isLoadingLiveClass, setIsLoadingLiveClass] = useState(true)

  useEffect(() => {
    async function fetchActiveLiveClasses() {
      try {
        const response = await liveClassService.getActiveLiveClasses()
        if (response.success && response.data.length > 0) {
          setActiveLiveClass(response.data[0])
        }
      } catch (error) {
        console.error('Failed to fetch active live classes:', error)
      } finally {
        setIsLoadingLiveClass(false)
      }
    }
    fetchActiveLiveClasses()
  }, [])

  // Calculate Average Attendance
  const avgAttendance = activeCourses.length > 0 
    ? Math.round(activeCourses.reduce((acc, curr) => acc + curr.attendance, 0) / activeCourses.length) 
    : 0

  // Find the next upcoming class
  const upcomingClass = activeCourses
    .filter(c => c.nextClassTime)
    .sort((a, b) => new Date(a.nextClassTime).getTime() - new Date(b.nextClassTime).getTime())[0]

  return (
    <div className="space-y-6">
      {/* Welcome & Next Class Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-[24px] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-violet-600/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-2">
              Hello, {MOCK_STUDENT.name.split(' ')[0]}! <HandWaving size={28} className="text-amber-300" weight="fill" />
            </h2>
            <p className="text-violet-100 max-w-lg mb-6">Ready for your live sessions? Check your schedule and join your classes on time.</p>
          </div>

          {!isLoadingLiveClass && activeLiveClass ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[300px]">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-widest">Up Next</p>
                <span className="text-[10px] font-bold bg-red-500/80 px-2 py-0.5 rounded-full text-white animate-pulse">
                  LIVE NOW
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight mb-3 truncate" title={activeLiveClass.course.title}>
                {activeLiveClass.course.title}
              </h3>

              <div className="flex items-center gap-3 text-sm text-violet-100 mb-2">
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  Class {activeLiveClass.classNumber} / {activeLiveClass.course.totalSessions}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-violet-100 mb-4">
                <Clock size={16} weight="fill" />
                <span>
                  {new Date(activeLiveClass.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {' '} • {' '}
                  {new Date(activeLiveClass.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <a
                href={activeLiveClass.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-violet-600 w-full py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
              >
                <VideoCamera size={18} weight="fill" />
                Join Live Class
              </a>
            </div>
          ) : upcomingClass ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 min-w-[300px]">
              <div className="flex justify-between items-start mb-1">
                <p className="text-xs font-bold text-violet-200 uppercase tracking-widest">Up Next</p>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">
                  Class {upcomingClass.nextClassNumber} / {upcomingClass.totalClasses}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-tight mb-3 truncate" title={upcomingClass.title}>{upcomingClass.title}</h3>

              <div className="flex items-center gap-2 text-sm text-violet-100 mb-4">
                <Clock size={16} weight="fill" />
                <span>
                  {new Date(upcomingClass.nextClassTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  {' '} • {' '}
                  {new Date(upcomingClass.nextClassTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <a
                href={upcomingClass.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-violet-600 w-full py-2.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform"
              >
                <VideoCamera size={18} weight="fill" />
                Join Live Class
              </a>
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
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{completedCourses.filter(c => c.certificateId).length}</p>
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase mt-1">Certificates</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (Main Content) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Active Courses */}
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
              {activeCourses.length > 0 ? activeCourses.map(course => (
                <Link key={course.id} to={`/dashboard/courses/${course.id}`} className="bg-slate-50 dark:bg-neutral-800/30 rounded-2xl p-4 border border-slate-100 dark:border-neutral-800 flex flex-col hover:bg-slate-100 dark:hover:bg-neutral-800/50 transition-colors group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <VideoCamera size={20} weight="fill" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-white dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 rounded-md border border-slate-200 dark:border-neutral-700">
                      {course.level}
                    </span>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{course.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">Inst: {course.instructorName}</p>
                  
                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 p-2 rounded-lg border border-slate-100 dark:border-neutral-700">
                      <CalendarBlank size={14} className="text-violet-600" />
                      {course.schedule}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-bold pt-2">
                      <span className="text-slate-500 dark:text-neutral-400">Attendance</span>
                      <span className={course.attendance >= 80 ? "text-green-600" : "text-amber-500"}>
                        {course.attendance}% ({course.attendedClasses}/{course.totalClasses})
                      </span>
                    </div>
                  </div>
                </Link>
              )) : (
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
                  {pendingAssignments.map(assignment => (
                    <div key={assignment.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{assignment.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2">{assignment.courseName}</p>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-full w-fit">
                          <Clock size={12} weight="bold" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedTask({ title: assignment.title, course: assignment.courseName }); setSubmitModalOpen(true); }}
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

        {/* Right Column (Sidebar Widgets) */}
        <div className="space-y-6">
          
          {/* Noticeboard */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/5">
              <Megaphone size={20} weight="fill" className="text-blue-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">Noticeboard</h3>
            </div>
            <div className="p-0 divide-y divide-slate-100 dark:divide-neutral-800">
              {MOCK_ANNOUNCEMENTS.map(announcement => (
                <div key={announcement.id} className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      announcement.type === 'alert' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                    }`}>
                      {announcement.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(announcement.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{announcement.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">{announcement.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-slate-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Payments</h3>
              <button onClick={() => onNavigate('payments')} className="text-xs font-bold text-violet-600 hover:text-violet-700">View All</button>
            </div>
            <div className="space-y-4">
              {recentPayments.map(payment => (
                <div key={payment.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-100 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 flex-shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mb-0.5" title={payment.description}>{payment.description}</p>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-500 flex items-center gap-1 font-medium">
                      <Clock size={10} /> {new Date(payment.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </p>
                    <p className={`text-[9px] font-bold uppercase tracking-wider ${payment.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                      {payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
      {/* Assignment Upload Modal */}
      <StudentAssignmentModal 
        isOpen={submitModalOpen} 
        onClose={() => setSubmitModalOpen(false)} 
        assignmentTitle={selectedTask?.title || ''} 
        courseName={selectedTask?.course || ''} 
      />
    </div>
  )
}