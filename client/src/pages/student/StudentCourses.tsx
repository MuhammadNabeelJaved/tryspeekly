import { useState } from 'react'
import { VideoCamera, CalendarBlank, FilePdf, ShieldCheck, Certificate, CheckCircle, ChatCircleDots } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { MOCK_ENROLLED_COURSES } from './studentData'
import InstructorChatModal from './InstructorChatModal'

export default function StudentCourses() {
  const activeCourses = MOCK_ENROLLED_COURSES.filter(c => c.status === 'active')
  const completedCourses = MOCK_ENROLLED_COURSES.filter(c => c.status === 'completed')

  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [selectedInstructor, setSelectedInstructor] = useState({ name: '', courseTitle: '' })

  const openChat = (e: React.MouseEvent, instructorName: string, courseTitle: string) => {
    e.preventDefault() // Prevent navigation to course details
    setSelectedInstructor({ name: instructorName, courseTitle })
    setChatModalOpen(true)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">My Live Classes</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">Join your live sessions, check your schedule, and access class materials.</p>
      </div>

      {activeCourses.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Active Batches</h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {activeCourses.map(course => (
              <Link to={`/dashboard/courses/${course.id}`} key={course.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors group">
                
                {/* Info Section */}
                <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-neutral-800">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-md uppercase tracking-wide">
                      {course.level}
                    </span>
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${course.attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                      <ShieldCheck size={14} weight="fill" />
                      {course.attendance}% Attendance ({course.attendedClasses}/{course.totalClasses})
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 transition-colors">{course.title}</h4>
                  
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-sm text-slate-500 dark:text-neutral-400">Instructor: <span className="font-semibold text-slate-700 dark:text-neutral-300">{course.instructorName}</span></p>
                    <button 
                      onClick={(e) => openChat(e, course.instructorName, course.title)}
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
                        <p className="text-[10px] text-slate-400 dark:text-neutral-500 uppercase tracking-wide">Batch Schedule</p>
                        <p>{course.schedule}</p>
                      </div>
                    </div>
                    
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2.5 rounded-xl transition-colors text-sm">
                      <FilePdf size={18} />
                      Class Materials & Notes
                    </button>
                  </div>
                </div>

                {/* Zoom Section */}
                <div className="p-6 md:w-64 bg-slate-50 dark:bg-neutral-900/50 flex flex-col justify-center">
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
                      <VideoCamera size={24} weight="fill" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Next Live Class</p>
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                        {course.nextClassNumber}/{course.totalClasses}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {course.nextClassTime ? new Date(course.nextClassTime).toLocaleString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      }) : 'Waiting for schedule'}
                    </p>
                  </div>

                  <a 
                    href={course.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)] mb-4"
                  >
                    Join via Zoom
                  </a>

                  <div className="text-xs text-center space-y-1 text-slate-500 dark:text-neutral-400 font-medium">
                    <p>Meeting ID: <span className="text-slate-900 dark:text-white font-bold">{course.meetingId}</span></p>
                    <p>Passcode: <span className="text-slate-900 dark:text-white font-bold">{course.passcode}</span></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {completedCourses.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-4">Completed Courses</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCourses.map(course => (
              <Link to={`/dashboard/courses/${course.id}`} key={course.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col group hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                      <CheckCircle size={20} weight="fill" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md flex items-center gap-1">
                      <CheckCircle size={12} weight="fill" /> Completed
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-violet-600 transition-colors">{course.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4">Instructor: {course.instructorName}</p>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-white font-bold py-2 rounded-xl transition-colors text-xs">
                    <FilePdf size={16} /> Review Notes
                  </button>
                  {course.certificateUrl && (
                    <button className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-700 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 font-bold py-2 rounded-xl transition-colors text-xs" onClick={(e) => { e.preventDefault(); window.location.href=`/certificate/${course.certificateId}` }}>
                      <Certificate size={16} weight="fill" />
                      Certificate
                    </button>
                  )}
                </div>
              </Link>
            ))}
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