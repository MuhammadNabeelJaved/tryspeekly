import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { INSTRUCTOR_COURSES } from './instructorData'
import { BookOpen, Users, Clock, Plus, X, Check, PencilSimple, Trash } from '@phosphor-icons/react'

type InstructorCourse = {
  id: string
  title: string
  students: number
  status: string
  nextClass: string
  progress: number
  level?: string
  duration?: string
  description?: string
  totalClasses?: number
  maxStudents?: number
}

const EMPTY_COURSE: InstructorCourse = {
  id: '',
  title: '',
  students: 0,
  status: 'draft',
  nextClass: 'TBD',
  progress: 0,
  level: 'Beginner',
  duration: '',
  description: '',
  totalClasses: 12,
  maxStudents: 15
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Input({ register, name, type = 'text', placeholder, valueAsNumber }: { register: any; name: string; type?: string; placeholder?: string; valueAsNumber?: boolean }) {
  return (
    <input type={type} {...register(name, { valueAsNumber })} placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
    />
  )
}

export default function InstructorCourses() {
  const [courses, setCourses] = useState<InstructorCourse[]>(INSTRUCTOR_COURSES)
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const { register, handleSubmit, reset } = useForm<InstructorCourse>({
    defaultValues: EMPTY_COURSE
  })

  function openAdd() {
    reset({ ...EMPTY_COURSE, id: `c${Date.now()}` })
    setModalType('add')
  }

  function openEdit(course: InstructorCourse) {
    reset(course)
    setModalType('edit')
  }

  function onSave(data: InstructorCourse) {
    if (modalType === 'add') {
      setCourses([...courses, data])
    } else {
      setCourses(courses.map(c => c.id === data.id ? data : c))
    }
    setModalType(null)
  }

  function handleDelete(id: string) {
    setCourses(courses.filter(c => c.id !== id))
    setDeleteId(null)
  }

  // Derived stats
  const activeCount = courses.filter(c => c.status === 'active').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalEnrolled = courses.reduce((sum, c) => sum + c.students, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Course Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Manage your course drafts, proposals, and active listings.</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-violet-600/30">
          <Plus size={18} weight="bold" />
          Propose New Course
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
             <BookOpen size={24} weight="fill" />
           </div>
           <div>
             <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{activeCount}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-1">Active Courses</p>
           </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
             <PencilSimple size={24} weight="fill" />
           </div>
           <div>
             <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{draftCount}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-1">Drafts & Proposals</p>
           </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
             <Users size={24} weight="fill" />
           </div>
           <div>
             <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{totalEnrolled}</p>
             <p className="text-xs font-bold text-slate-500 uppercase mt-1">Total Enrolled</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm flex flex-col hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700/50 transition-all duration-300 group">
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    course.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    course.status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    {course.status}
                </div>
                {course.level && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                    {course.level}
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {course.title}
              </h3>

              {course.description && (
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}
              
              {/* Enrollment Progress */}
              <div className="mt-4 mb-4 bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300">
                    <Users size={14} className="text-violet-500" weight="bold" />
                    {course.students} / {course.maxStudents || 15} Enrolled
                  </div>
                  <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                    {Math.round((course.students / (course.maxStudents || 15)) * 100)}% Full
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-600 rounded-full" 
                    style={{ width: `${Math.min((course.students / (course.maxStudents || 15)) * 100, 100)}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                  <Clock size={14} /> {course.duration || 'N/A'}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                  <BookOpen size={14} /> {course.totalClasses || 0} Classes
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 flex gap-2">
              <button onClick={() => openEdit(course)} className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                <PencilSimple size={16} /> Edit Details
              </button>
              <button onClick={() => setDeleteId(course.id)} className="w-10 flex items-center justify-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:border-red-900/50 dark:hover:text-red-400 text-slate-400 px-3 py-2.5 rounded-xl transition-all shadow-sm hover:shadow">
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Add New Ghost Card */}
        <button onClick={openAdd} className="bg-slate-50 dark:bg-neutral-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-violet-400 dark:hover:border-violet-600 flex flex-col items-center justify-center min-h-[300px] text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-all group">
          <div className="w-14 h-14 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
            <Plus size={24} weight="bold" />
          </div>
          <span className="font-bold">Propose New Course</span>
        </button>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {modalType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.form onSubmit={handleSubmit(onSave)} initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{modalType === 'add' ? 'Propose New Course' : 'Edit Course Details'}</h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">Fill in the details below to submit your course to admins.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              
              <div className="p-8 grid grid-cols-2 gap-6 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="col-span-2"><Field label="Course Title"><Input register={register} name="title" placeholder="e.g. Master Business English" /></Field></div>
                
                <div className="col-span-2">
                  <Field label="Description">
                    <textarea {...register('description')} rows={3} placeholder="Describe what students will learn..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 transition-colors resize-none shadow-sm" />
                  </Field>
                </div>

                <Field label="Level">
                  <select {...register('level')} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors shadow-sm">
                    {['Beginner', 'Intermediate', 'Advanced', 'Business', 'Kids'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                
                <Field label="Duration (Weeks/Months)"><Input register={register} name="duration" placeholder="e.g. 12 Weeks" /></Field>
                
                <Field label="Total Classes"><Input register={register} name="totalClasses" type="number" placeholder="24" valueAsNumber /></Field>
                <Field label="Max Students Limit"><Input register={register} name="maxStudents" type="number" placeholder="15" valueAsNumber /></Field>
                
                <Field label="Status">
                  <select {...register('status')} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors shadow-sm">
                    {['active', 'upcoming', 'draft'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                
                <div className="col-span-2 mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
                  <Users size={20} className="text-blue-500 shrink-0" weight="fill" />
                  <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    <strong>Note:</strong> Once proposed, the admin will review the course and make it live on the main website. Pricing and billing will be managed by the admin team.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-8 py-6 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-b-[32px]">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm font-bold text-slate-700 dark:text-neutral-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-colors">
                  <Check size={18} weight="bold" /> {modalType === 'add' ? 'Submit Proposal' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-3xl p-8 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
                <Trash size={28} weight="fill" className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Course?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400 mb-8 px-4">Are you sure you want to delete this course draft? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm font-bold text-slate-700 dark:text-neutral-300 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-black shadow-lg shadow-red-500/30 transition-colors">Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}