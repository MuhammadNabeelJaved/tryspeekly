import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, PencilSimple, Trash, X, Check, Users, Clock, CurrencyCircleDollar } from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import type { Course } from './adminData'

const EMPTY: Course = {
  id: '', title: '', level: 'Beginner', duration: '', price: 0, currency: 'PKR',
  instructorId: '', instructorName: '', totalStudents: 0, maxStudents: 15,
  status: 'active', description: '', startDate: new Date().toISOString().split('T')[0],
  schedule: '', features: [],
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  Intermediate: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  Advanced: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
  Kids: 'bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400',
  Business: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  inactive: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
  draft: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
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

export default function AdminCourses({ store }: { store: AdminStore }) {
  const { courses, setCourses, instructors } = store
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const { register, handleSubmit, reset, setValue } = useForm<Course & { featuresInput: string }>({
    defaultValues: { ...EMPTY, featuresInput: '' }
  })

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.title.toLowerCase().includes(q) || c.instructorName.toLowerCase().includes(q)
    const matchS = filterStatus === 'All' || c.status === filterStatus
    return matchQ && matchS
  })

  function openAdd() {
    reset({ ...EMPTY, id: `c${Date.now()}`, featuresInput: '' })
    setModalType('add')
  }

  function openEdit(course: Course) {
    reset({ ...course, featuresInput: course.features.join(', ') })
    setModalType('edit')
  }

  function onSave(data: Course & { featuresInput: string }) {
    const course: Course = {
      ...data,
      features: data.featuresInput.split(',').map(f => f.trim()).filter(Boolean),
    }
    if (modalType === 'add') {
      setCourses([...courses, course])
    } else {
      setCourses(courses.map(c => c.id === course.id ? course : c))
    }
    setModalType(null)
  }

  function handleDelete(id: string) {
    setCourses(courses.filter(c => c.id !== id))
    setDeleteId(null)
  }

  function pickInstructor(id: string) {
    const inst = instructors.find(i => i.id === id)
    setValue('instructorId', id)
    setValue('instructorName', inst?.name ?? '')
  }

  const totalEnrolled = courses.reduce((a, c) => a + c.totalStudents, 0)
  const totalRevenue = courses.reduce((a, c) => a + c.price * c.totalStudents, 0)

  return (
    <div className="p-4 sm:p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Courses <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">({courses.length})</span></h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Manage course catalog and enrollment</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors self-start">
          <Plus size={15} weight="bold" />New Course
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Courses', value: courses.length, Icon: CurrencyCircleDollar, color: 'from-violet-500 to-purple-600' },
          { label: 'Total Enrolled', value: totalEnrolled, Icon: Users, color: 'from-blue-500 to-blue-700' },
          { label: 'Est. Revenue', value: `₨${totalRevenue.toLocaleString()}`, Icon: Clock, color: 'from-emerald-500 to-emerald-700' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} weight="fill" className="text-white" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900 dark:text-white leading-none">{value}</p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
          {['All', 'active', 'inactive', 'draft'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      {/* Course cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((course, idx) => {
          const fillPct = course.maxStudents > 0 ? Math.min((course.totalStudents / course.maxStudents) * 100, 100) : 0
          return (
            <motion.div key={course.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200"
            >
              {/* Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${LEVEL_COLORS[course.level] ?? 'bg-slate-100 text-slate-500'}`}>{course.level}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[course.status]}`}>{course.status}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{course.title}</h3>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">{course.instructorName}</p>
                  </div>
                  <p className="text-base font-black text-violet-600 dark:text-violet-400 flex-shrink-0 ml-2">₨{course.price.toLocaleString()}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed mb-3 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-neutral-600 mb-3">
                  <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
                  <span className="flex items-center gap-1"><Users size={11} />{course.totalStudents}/{course.maxStudents}</span>
                </div>
                {/* Enrollment bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400">Enrollment</span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400">{Math.round(fillPct)}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 0.8, delay: idx * 0.05 }}
                      className={`h-full rounded-full ${fillPct >= 90 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-violet-500 to-purple-600'}`}
                    />
                  </div>
                </div>
              </div>
              {/* Schedule */}
              {course.schedule && (
                <div className="px-5 pb-3">
                  <p className="text-[10px] text-slate-400 dark:text-neutral-600 font-medium">{course.schedule}</p>
                </div>
              )}
              {/* Actions */}
              <div className="flex border-t border-slate-100 dark:border-neutral-800">
                <button onClick={() => openEdit(course)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1.5 transition-colors">
                  <PencilSimple size={13} />Edit
                </button>
                <div className="w-px bg-slate-100 dark:bg-neutral-800" />
                <button onClick={() => setDeleteId(course.id)} className="flex-1 py-2.5 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1.5 transition-colors">
                  <Trash size={13} />Delete
                </button>
              </div>
            </motion.div>
          )
        })}

        {/* Add card */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={openAdd}
          className="border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-[20px] p-8 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-neutral-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-400 dark:hover:text-violet-500 transition-all min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
            <Plus size={20} />
          </div>
          <p className="text-sm font-semibold">Add Course</p>
        </motion.button>
      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {modalType && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.form onSubmit={handleSubmit(onSave)} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900 z-10">
                <h3 className="text-base font-black text-slate-900 dark:text-white">{modalType === 'add' ? 'New Course' : 'Edit Course'}</h3>
                <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2"><Field label="Course Title"><Input register={register} name="title" placeholder="Business English" /></Field></div>
                <Field label="Level">
                  <select {...register('level')} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                    {['Beginner', 'Intermediate', 'Advanced', 'Business', 'Kids'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Duration"><Input register={register} name="duration" placeholder="3 months" /></Field>
                <Field label="Price (PKR)"><Input register={register} name="price" type="number" placeholder="8000" valueAsNumber /></Field>
                <Field label="Max Students"><Input register={register} name="maxStudents" type="number" placeholder="15" valueAsNumber /></Field>
                <Field label="Instructor">
                  <select {...register('instructorId', { onChange: e => pickInstructor(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                    <option value="">Select instructor…</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select {...register('status')} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors">
                    {['active', 'inactive', 'draft'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Start Date"><Input register={register} name="startDate" type="date" /></Field>
                <Field label="Schedule"><Input register={register} name="schedule" placeholder="Mon/Wed/Fri · 7–8 PM PKT" /></Field>
                <div className="col-span-2">
                  <Field label="Description">
                    <textarea {...register('description')} rows={2} placeholder="Short description of the course…" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none" />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Features (comma-separated)">
                    <input {...register('featuresInput')} placeholder="Grammar, Speaking, Writing, Vocabulary" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
                  <Check size={15} weight="bold" />{modalType === 'add' ? 'Create Course' : 'Save Changes'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4"><Trash size={22} className="text-red-500" /></div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Delete Course?</h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
