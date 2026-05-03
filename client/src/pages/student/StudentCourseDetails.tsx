import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, VideoCamera, CalendarBlank, FilePdf, ShieldCheck, Clock, CheckCircle, DownloadSimple, ChatCircleDots } from '@phosphor-icons/react'
import { MOCK_ENROLLED_COURSES, MOCK_ASSIGNMENTS } from './studentData'
import StudentAssignmentModal from './StudentAssignmentModal'
import InstructorChatModal from './InstructorChatModal'

export default function StudentCourseDetails() {
  const { id } = useParams()
  const course = MOCK_ENROLLED_COURSES.find(c => c.id === id)
  
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{title: string, course: string} | null>(null)
  
  const [chatModalOpen, setChatModalOpen] = useState(false)
  
  if (!course) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Course Not Found</h2>
        <p className="text-slate-500 dark:text-neutral-400 mb-6">The course you are looking for does not exist or you are not enrolled.</p>
        <Link to="/dashboard/courses" className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold">Go Back</Link>
      </div>
    )
  }

  const courseAssignments = MOCK_ASSIGNMENTS.filter(a => a.courseName === course.title)

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Link to="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors mb-4">
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-bold px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-md uppercase tracking-wide">
                {course.level}
              </span>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide ${course.status === 'active' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>
                {course.status}
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2">{course.title}</h1>
            <div className="flex items-center gap-4 text-slate-500 dark:text-neutral-400">
              <p>Instructor: <span className="font-bold text-slate-700 dark:text-neutral-300">{course.instructorName}</span></p>
              {course.status === 'active' && (
                <button 
                  onClick={() => setChatModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 px-2 py-1 rounded transition-colors"
                >
                  <ChatCircleDots size={16} weight="fill" /> Chat with Instructor
                </button>
              )}
            </div>
          </div>
          
          {course.status === 'active' && course.nextClassTime && (
            <a 
              href={course.meetingLink}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Tabs/Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress & Attendance Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Course Progress</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5"><CalendarBlank size={16} /> Classes</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{course.nextClassNumber} / {course.totalClasses}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-600 rounded-full" style={{ width: `${(course.nextClassNumber / course.totalClasses) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-600 dark:text-neutral-400 flex items-center gap-1.5"><ShieldCheck size={16} /> Attendance</span>
                  <span className={`text-sm font-bold ${course.attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>{course.attendance}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${course.attendance >= 80 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${course.attendance}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <h3 className="font-bold text-slate-900 dark:text-white">Class Materials & Notes</h3>
            </div>
            <div className="p-0 divide-y divide-slate-100 dark:border-neutral-800">
              {[1, 2, 3].map(num => (
                <div key={num} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                      <FilePdf size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Module {num} Presentation Notes</p>
                      <p className="text-[10px] text-slate-500 dark:text-neutral-400">PDF Document • 2.4 MB</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors">
                    <DownloadSimple size={16} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Assignments */}
          {courseAssignments.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-neutral-800 bg-amber-50/50 dark:bg-amber-900/5">
                <h3 className="font-bold text-slate-900 dark:text-white">Assignments</h3>
              </div>
              <div className="p-0 divide-y divide-slate-100 dark:border-neutral-800">
                {courseAssignments.map(ass => (
                  <div key={ass.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{ass.title}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 font-semibold flex items-center gap-1">
                        <Clock size={12} weight="bold" /> Due: {new Date(ass.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => { setSelectedTask({ title: ass.title, course: ass.courseName }); setSubmitModalOpen(true); }}
                      className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                    >
                      Submit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Next Class & Schedule */}
        <div className="space-y-6">
          {course.status === 'active' && (
            <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-[0_8px_24px_rgba(37,99,235,0.25)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <VideoCamera size={24} weight="fill" />
                  <h3 className="font-bold text-lg">Next Live Class</h3>
                </div>
                <div className="bg-white/10 rounded-xl p-4 mb-4 backdrop-blur-sm border border-white/20">
                  <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">Time</p>
                  <p className="text-xl font-black mb-1">
                    {course.nextClassTime ? new Date(course.nextClassTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBA'}
                  </p>
                  <p className="text-sm text-blue-100 font-medium">
                    {course.nextClassTime ? new Date(course.nextClassTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
                  </p>
                </div>
                <div className="space-y-2 text-sm font-medium bg-blue-900/40 p-3 rounded-xl border border-blue-800">
                  <p className="flex justify-between"><span className="text-blue-200">Meeting ID:</span> <span>{course.meetingId}</span></p>
                  <p className="flex justify-between"><span className="text-blue-200">Passcode:</span> <span>{course.passcode}</span></p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Schedule Details</h3>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 p-4 rounded-xl border border-slate-100 dark:border-neutral-700">
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-neutral-900 flex items-center justify-center text-slate-400 dark:text-neutral-500 shadow-sm flex-shrink-0">
                <CalendarBlank size={20} weight="fill" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Routine</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{course.schedule}</p>
              </div>
            </div>
          </div>

          {course.status === 'completed' && course.certificateId && (
            <div className="bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-200 dark:border-green-900/30 p-6 shadow-sm text-center">
              <CheckCircle size={48} weight="fill" className="mx-auto text-green-500 mb-3" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Course Completed!</h3>
              <p className="text-sm text-slate-600 dark:text-neutral-400 mb-4">You have successfully finished this course and earned your certificate.</p>
              <Link to={`/dashboard/certificates/${course.certificateId}`} className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-[0_4px_12px_rgba(22,163,74,0.25)]">
                View Certificate
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Assignment Upload Modal */}
      <StudentAssignmentModal 
        isOpen={submitModalOpen} 
        onClose={() => setSubmitModalOpen(false)} 
        assignmentTitle={selectedTask?.title || ''} 
        courseName={selectedTask?.course || ''} 
      />

      {/* Instructor Chat Modal */}
      {course && (
        <InstructorChatModal 
          isOpen={chatModalOpen} 
          onClose={() => setChatModalOpen(false)} 
          instructorName={course.instructorName}
          courseTitle={course.title}
        />
      )}
    </div>
  )
}