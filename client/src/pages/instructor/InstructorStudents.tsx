import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { INSTRUCTOR_STUDENTS } from './instructorData'
import { MagnifyingGlass, FunnelSimple, Check, X, EnvelopeSimple, Phone, CalendarBlank, ChartBar, Star, BookOpen, UserMinus, Clock, ChatCircleText } from '@phosphor-icons/react'

type Student = typeof INSTRUCTOR_STUDENTS[0] & { todayStatus?: 'present' | 'absent' | 'late' }

export default function InstructorStudents() {
  const [students, setStudents] = useState<Student[]>(INSTRUCTOR_STUDENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name-asc')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late' | null) => {

    setStudents(students.map(s => {
      if (s.id === studentId) {
        let newAttended = s.attendedClasses
        const wasCredited = s.todayStatus === 'present' || s.todayStatus === 'late'
        const nowCredited = status === 'present' || status === 'late'

        if (!wasCredited && nowCredited) {
          newAttended = Math.min(s.attendedClasses + 1, s.totalClasses)
        } else if (wasCredited && !nowCredited) {
          newAttended = Math.max(s.attendedClasses - 1, 0)
        }

        const newPercentage = Math.round((newAttended / s.totalClasses) * 100)
        return { ...s, attendedClasses: newAttended, attendance: newPercentage, todayStatus: status || undefined }
      }
      return s
    }))
  }

  const filteredStudents = students
    .filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCourse = courseFilter === 'all' || s.course === courseFilter
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter
      return matchesSearch && matchesCourse && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name)
      if (sortBy === 'attendance-desc') return b.attendance - a.attendance
      if (sortBy === 'attendance-asc') return a.attendance - b.attendance
      return 0
    })

  const courses = Array.from(new Set(students.map(s => s.course)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Students</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">View progress and attendance of your enrolled students.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search students by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select 
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="all">All Courses</option>
                {courses.map(course => <option key={course} value={course}>{course}</option>)}
              </select>

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="needs_attention">Needs Attention</option>
              </select>

              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="attendance-desc">Highest Attendance</option>
                <option value="attendance-asc">Lowest Attendance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-neutral-800/50 text-slate-500 dark:text-neutral-400 font-semibold border-b border-slate-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800 text-slate-700 dark:text-neutral-300">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      {student.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.course}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${student.attendance >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                          {student.attendance}%
                        </span>
                        <span className="text-xs text-slate-400 dark:text-neutral-500">
                          ({student.attendedClasses} / {student.totalClasses})
                        </span>
                      </div>
                      <div className="h-1.5 w-24 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${student.attendance >= 80 ? 'bg-green-500' : 'bg-amber-500'}`} 
                          style={{ width: `${student.attendance}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      student.status === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      student.status === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {student.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      
                      {/* Attendance Actions */}
                      <div className="flex bg-slate-100 dark:bg-neutral-800 rounded-lg p-1 gap-1">
                        <button 
                          onClick={() => updateAttendance(student.id, student.todayStatus === 'present' ? null : 'present')}
                          title="Mark Present"
                          className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                            student.todayStatus === 'present' 
                              ? 'bg-emerald-500 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                          }`}
                        >
                          <Check size={16} weight="bold" />
                        </button>
                        <button 
                          onClick={() => updateAttendance(student.id, student.todayStatus === 'late' ? null : 'late')}
                          title="Mark Late"
                          className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                            student.todayStatus === 'late' 
                              ? 'bg-amber-500 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          }`}
                        >
                          <Clock size={16} weight="bold" />
                        </button>
                        <button 
                          onClick={() => updateAttendance(student.id, student.todayStatus === 'absent' ? null : 'absent')}
                          title="Mark Absent"
                          className={`p-1.5 rounded-md flex items-center justify-center transition-all ${
                            student.todayStatus === 'absent' 
                              ? 'bg-red-500 text-white shadow-sm' 
                              : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          <UserMinus size={16} weight="bold" />
                        </button>
                      </div>

                      <button 
                        onClick={() => setSelectedStudent(student)}
                        className="text-violet-600 dark:text-violet-400 font-bold hover:underline text-sm ml-2"
                      >
                        Profile
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="p-8 text-center text-slate-500 dark:text-neutral-400">
            No students found.
          </div>
        )}
      </div>

      {/* STUDENT PROFILE MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex-shrink-0">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-2xl shadow-sm">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1">{selectedStudent.name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      selectedStudent.status === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      selectedStudent.status === 'good' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {selectedStudent.status.replace('_', ' ')} Student
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedStudent(null)} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                
                {/* Contact & Basics Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-neutral-800">
                    <CalendarBlank size={20} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Enrolled On</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">Oct 12, 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-neutral-800">
                    <Star size={20} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg. Score</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-neutral-300">88% (A Grade)</p>
                    </div>
                  </div>
                </div>

                {/* Course Details */}
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen size={18} className="text-violet-500" /> Course Details
                  </h3>
                  <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
                      <div>
                        <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-1">Currently Enrolled</p>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedStudent.course}</h4>
                      </div>
                    </div>
                    
                    {/* Attendance Progress */}
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <ChartBar size={16} className="text-slate-400" /> Attendance Rate
                        </span>
                        <div className="text-right">
                          <span className={`text-lg font-black ${selectedStudent.attendance >= 80 ? 'text-green-500' : 'text-amber-500'}`}>{selectedStudent.attendance}%</span>
                          <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-medium">({selectedStudent.attendedClasses} out of {selectedStudent.totalClasses} classes)</p>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${selectedStudent.attendance >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-amber-500'}`} 
                          style={{ width: `${selectedStudent.attendance}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Footer Actions */}
              <div className="p-5 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex flex-col sm:flex-row gap-3">
                <button onClick={() => window.location.href = '/instructor/messages'} className="flex-1 py-3 flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
                  <ChatCircleText size={18} weight="fill" className="text-violet-500" />
                  Direct Message
                </button>
                
                <div className="flex-1 flex bg-slate-100 dark:bg-neutral-800 rounded-xl p-1 shadow-inner">
                  <button 
                    onClick={() => {
                      updateAttendance(selectedStudent.id, selectedStudent.todayStatus === 'present' ? null : 'present');
                      
                      const willBePresent = selectedStudent.todayStatus !== 'present';
                      const wasCredited = selectedStudent.todayStatus === 'present' || selectedStudent.todayStatus === 'late';
                      let newAttended = selectedStudent.attendedClasses;
                      
                      if (!wasCredited && willBePresent) newAttended = Math.min(newAttended + 1, selectedStudent.totalClasses);
                      else if (wasCredited && !willBePresent) newAttended = Math.max(newAttended - 1, 0);

                      setSelectedStudent({
                        ...selectedStudent, 
                        todayStatus: willBePresent ? 'present' : undefined, 
                        attendedClasses: newAttended,
                        attendance: Math.round((newAttended / selectedStudent.totalClasses) * 100)
                      });
                    }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${selectedStudent.todayStatus === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}
                  >
                    <Check size={16} /> Present
                  </button>
                  <button 
                    onClick={() => {
                      updateAttendance(selectedStudent.id, selectedStudent.todayStatus === 'late' ? null : 'late');
                      
                      const willBeLate = selectedStudent.todayStatus !== 'late';
                      const wasCredited = selectedStudent.todayStatus === 'present' || selectedStudent.todayStatus === 'late';
                      let newAttended = selectedStudent.attendedClasses;
                      
                      if (!wasCredited && willBeLate) newAttended = Math.min(newAttended + 1, selectedStudent.totalClasses);
                      else if (wasCredited && !willBeLate) newAttended = Math.max(newAttended - 1, 0);

                      setSelectedStudent({
                        ...selectedStudent, 
                        todayStatus: willBeLate ? 'late' : undefined, 
                        attendedClasses: newAttended,
                        attendance: Math.round((newAttended / selectedStudent.totalClasses) * 100)
                      });
                    }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${selectedStudent.todayStatus === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}
                  >
                    <Clock size={16} /> Late
                  </button>
                  <button 
                    onClick={() => {
                      updateAttendance(selectedStudent.id, selectedStudent.todayStatus === 'absent' ? null : 'absent');
                      
                      const willBeAbsent = selectedStudent.todayStatus !== 'absent';
                      const wasCredited = selectedStudent.todayStatus === 'present' || selectedStudent.todayStatus === 'late';
                      let newAttended = selectedStudent.attendedClasses;
                      
                      if (wasCredited && willBeAbsent) newAttended = Math.max(newAttended - 1, 0);

                      setSelectedStudent({
                        ...selectedStudent, 
                        todayStatus: willBeAbsent ? 'absent' : undefined, 
                        attendedClasses: newAttended,
                        attendance: Math.round((newAttended / selectedStudent.totalClasses) * 100)
                      });
                    }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${selectedStudent.todayStatus === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                  >
                    <UserMinus size={16} /> Absent
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}