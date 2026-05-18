import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { coursesService } from '../../services/courses.service'
import { enrollmentsService } from '@/services/enrollments.service'

import { BookOpen, Users, Clock, Plus, X, Check, PencilSimple, Trash, MagnifyingGlass, CheckCircle, CalendarBlank, ChartBar } from '@phosphor-icons/react'

type CourseItem = {
  id: string
  title: string
  date: string
  time: string
  type: string
  isFree: boolean
}

type CourseModule = {
  id: string
  title: string
  duration: string
  items: CourseItem[]
}

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
  category?: string
  price?: string
  originalPrice?: string
  schedule?: string
  startDate?: string
  platform?: string
  language?: string
  image?: string
  videoPreview?: string
  whatYouWillLearn?: string
  curriculum?: CourseModule[]
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
  maxStudents: 15,
  category: 'Live Class',
  price: '',
  originalPrice: '',
  schedule: '',
  startDate: '',
  platform: 'Zoom / Google Meet',
  language: 'English',
  image: '',
  videoPreview: '',
  whatYouWillLearn: '',
  curriculum: []
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-emerald-500/90 text-white border border-emerald-400/50',
  upcoming: 'bg-blue-500/90 text-white border border-blue-400/50',
  draft:    'bg-slate-800/90 text-white border border-slate-700/50',
  pending:  'bg-amber-500/90 text-white border border-amber-400/50',
  rejected: 'bg-red-500/90 text-white border border-red-400/50',
}

const STATUS_LABELS: Record<string, string> = {
  active:   'Active',
  upcoming: 'Upcoming',
  draft:    'Draft',
  pending:  'Under Review',
  rejected: 'Rejected',
}

function mapBackendCourse(c: any): InstructorCourse {
  const statusMap: Record<string, string> = {
    published: 'active',
    archived: 'draft',
    draft: 'draft',
    pending: 'pending',
    rejected: 'rejected',
  }
  return {
    id: String(c._id),
    title: c.title,
    students: c.enrolledStudents?.length || 0,
    status: statusMap[c.status] || c.status,
    nextClass: c.recurringSchedule?.[0] ? `${c.recurringSchedule[0].day}, ${c.recurringSchedule[0].time}` : 'TBD',
    progress: 0,
    totalClasses: c.totalSessions,
    maxStudents: c.maxStudents,
    level: c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Beginner',
    duration: c.type,
    description: c.description,
    category: c.focus,
    price: c.price ? `${c.currency === 'PKR' ? 'Rs' : '$'}${c.price}` : '',
    startDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
    image: c.thumbnail,
    language: 'English',
  }
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
  const [courses, setCourses] = useState<InstructorCourse[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  const [formTab, setFormTab] = useState<'basic' | 'logistics' | 'curriculum'>('basic')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [completedClassesMap, setCompletedClassesMap] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      try {
        const [res, enrollmentsRes] = await Promise.all([
          coursesService.getTeacherCourses(),
          enrollmentsService.getTeacherEnrollments()
        ])

        // Build completed classes map: max sessionsAttended across all enrollments per course
        const completedMap: Record<string, number> = {}
        if (enrollmentsRes.success && enrollmentsRes.data) {
          enrollmentsRes.data.forEach((enr: { course: { _id: string } | string; progress?: { sessionsAttended?: number } }) => {
            const courseId = typeof enr.course === 'string' ? enr.course : enr.course._id
            const attended = enr.progress?.sessionsAttended ?? 0
            completedMap[courseId] = Math.max(completedMap[courseId] ?? 0, attended)
          })
          setCompletedClassesMap(completedMap)
        }
        if (res.success && res.data.length > 0) {
          setCourses(res.data.map(mapBackendCourse))
        } else {
          setCourses([])
        }
      } catch {
        setCourses(FALLBACK_COURSES)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const { register, handleSubmit, reset, watch, setValue, getValues } = useForm<InstructorCourse>({
    defaultValues: EMPTY_COURSE
  })

  function openAdd() {
    reset({ ...EMPTY_COURSE, id: `c${Date.now()}`, curriculum: [] })
    setFormTab('basic')
    setModalType('add')
  }

  function openEdit(course: InstructorCourse) {
    reset({ ...course, curriculum: course.curriculum || [] })
    setFormTab('basic')
    setModalType('edit')
  }

  async function onSave(data: InstructorCourse) {
    try {
      if (modalType === 'add') {
        const res = await coursesService.createCourse({
          title: data.title,
          description: data.description || '',
          price: parseFloat(data.price?.replace(/[^0-9.]/g, '') || '0'),
          currency: 'USD',
          type: (data.category === 'Recorded Course' ? 'one-to-one' : data.category === 'Hybrid' ? 'hybrid' : 'group') as 'group' | 'one-to-one' | 'hybrid',
          level: (data.level?.toLowerCase() || 'beginner') as 'beginner' | 'intermediate' | 'advanced',
          focus: 'general',
          thumbnail: data.image || undefined,
          totalSessions: data.totalClasses || 12,
          sessionDuration: 60,
          maxStudents: data.maxStudents,
        })
        if (res.success) {
          setCourses([...courses, mapBackendCourse(res.data)])
          toast.success('Course submitted for review. You will be notified when approved.')
        }
      } else {
        const res = await coursesService.updateCourse(data.id, {
          title: data.title,
          description: data.description,
          price: parseFloat(data.price?.replace(/[^0-9.]/g, '') || '0'),
        })
        if (res.success) setCourses(courses.map(c => c.id === data.id ? mapBackendCourse(res.data) : c))
      }
    } catch {
      // Fallback: update locally
      if (modalType === 'add') {
        setCourses([...courses, data])
      } else {
        setCourses(courses.map(c => c.id === data.id ? data : c))
      }
    }
    setModalType(null)
  }

  async function handleDelete(id: string) {
    try {
      await coursesService.deleteCourse(id)
    } catch {
      // Fallback: remove locally
    }
    setCourses(courses.filter(c => c.id !== id))
    setDeleteId(null)
  }

  // Curriculum Helpers
  const currentCurriculum = watch('curriculum') || []

  function handleAddModule() {
    const cur = getValues('curriculum') || []
    setValue('curriculum', [...cur, { id: `m_${Date.now()}_${Math.random()}`, title: '', duration: '', items: [] }])
  }

  function handleUpdateModule(mIndex: number, field: keyof CourseModule, value: string) {
    const cur = getValues('curriculum') || []
    const newCur = [...cur]
    newCur[mIndex] = { ...newCur[mIndex], [field]: value }
    setValue('curriculum', newCur)
  }

  function handleRemoveModule(mIndex: number) {
    const cur = getValues('curriculum') || []
    const newCur = [...cur]
    newCur.splice(mIndex, 1)
    setValue('curriculum', newCur)
  }

  function handleAddLesson(mIndex: number) {
    const cur = getValues('curriculum') || []
    const newCur = [...cur]
    const newItems = [...(newCur[mIndex].items || [])]
    newItems.push({ id: `l_${Date.now()}_${Math.random()}`, title: '', date: '', time: '', type: 'live', isFree: false })
    newCur[mIndex] = { ...newCur[mIndex], items: newItems }
    setValue('curriculum', newCur)
  }

  function handleUpdateLesson(mIndex: number, lIndex: number, field: keyof CourseItem, value: any) {
    const cur = getValues('curriculum') || []
    const newCur = [...cur]
    const newItems = [...newCur[mIndex].items]
    newItems[lIndex] = { ...newItems[lIndex], [field]: value }
    newCur[mIndex] = { ...newCur[mIndex], items: newItems }
    setValue('curriculum', newCur)
  }

  function handleRemoveLesson(mIndex: number, lIndex: number) {
    const cur = getValues('curriculum') || []
    const newCur = [...cur]
    const newItems = [...newCur[mIndex].items]
    newItems.splice(lIndex, 1)
    newCur[mIndex] = { ...newCur[mIndex], items: newItems }
    setValue('curriculum', newCur)
  }

  async function handleResubmit(courseId: string) {
    try {
      const res = await coursesService.submitForReview(courseId)
      if (res.success) {
        setCourses(courses.map(c => c.id === courseId ? mapBackendCourse(res.data) : c))
        toast.success('Course resubmitted for review.')
      }
    } catch {
      toast.error('Could not resubmit. Please try again.')
    }
  }

  const filteredCourses = courses
    .filter(c => {
      const matchesSearch = 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.level?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesLevel = levelFilter === 'all' || c.level === levelFilter
      
      return matchesSearch && matchesStatus && matchesLevel
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return b.id.localeCompare(a.id)
      if (sortBy === 'students') return b.students - a.students
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      return 0
    })

  const levels = Array.from(new Set(courses.map(c => c.level).filter(Boolean))) as string[]

  // Derived stats
  const activeCount = courses.filter(c => c.status === 'active').length
  const draftCount = courses.filter(c => c.status === 'draft').length
  const totalEnrolled = courses.reduce((sum, c) => sum + c.students, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-40 bg-slate-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-4 w-60 bg-slate-100 dark:bg-neutral-700 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-neutral-800 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-neutral-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

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

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full lg:max-w-md">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by title, description, or level..."
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

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 lg:flex-none bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="draft">Draft</option>
          </select>

          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="flex-1 lg:flex-none bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="all">All Levels</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 lg:flex-none bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="students">Most Enrolled</option>
            <option value="title">Title (A-Z)</option>
          </select>
        </div>
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
        {filteredCourses.map(course => {
          const courseIdStr = (course.id || '').toString().trim()
          const completedCount = completedClassesMap[courseIdStr] || 0
          const totalClasses = course.totalClasses || 0
          const progress = totalClasses > 0 ? Math.round((completedCount / totalClasses) * 100) : 0

          return (
          <div key={course.id} className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm flex flex-col hover:shadow-lg hover:border-violet-300 dark:hover:border-violet-700/50 transition-all duration-300 group">
            
            {/* Image Banner & Badges */}
            <div className="relative h-48 bg-slate-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0">
              {course.image ? (
                <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 flex items-center justify-center">
                  <BookOpen size={48} className="text-violet-300 dark:text-violet-700/50" weight="duotone" />
                </div>
              )}
              
              {/* Top Badges */}
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm ${STATUS_COLORS[course.status] ?? STATUS_COLORS['draft']}`}>
                  {STATUS_LABELS[course.status] ?? course.status}
                </span>
                {course.category && (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white backdrop-blur-md shadow-sm border border-white/20 dark:border-white/10">
                    {course.category}
                  </span>
                )}
              </div>
              
              {/* Bottom Right Price */}
              {course.price && (
                <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-black/90 text-slate-900 dark:text-white font-black text-sm backdrop-blur-md shadow-sm border border-white/20 dark:border-white/10">
                  {course.price}
                </div>
              )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-neutral-400 mb-3">
                {course.level && <span className="flex items-center gap-1.5"><ChartBar size={14} className="text-violet-500" /> {course.level}</span>}
                {course.startDate && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                    <span className="flex items-center gap-1.5"><CalendarBlank size={14} className="text-blue-500" /> Starts {course.startDate}</span>
                  </>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                {course.title}
              </h3>

              {course.description && (
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed mb-4 line-clamp-2">
                  {course.description}
                </p>
              )}
              
              <div className="space-y-3 mt-auto mb-4">
                {/* Enrollment Progress */}
                <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <Users size={14} className="text-blue-500" weight="bold" />
                      {course.students} / {course.maxStudents || 15} Enrolled
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      {Math.round((course.students / (course.maxStudents || 15)) * 100)}% Full
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min((course.students / (course.maxStudents || 15)) * 100, 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Class Completion Progress */}
                <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-neutral-300">
                      <CheckCircle size={14} className="text-violet-500" weight="bold" />
                      {completedCount} / {totalClasses} Classes
                    </div>
                    <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-800 truncate">
                  <Clock size={14} className="shrink-0" /> <span className="truncate">{course.duration || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-neutral-800/50 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-neutral-800 truncate">
                  <BookOpen size={14} className="shrink-0" /> <span className="truncate">{course.totalClasses || 0} Total Sessions</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/30 flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button onClick={() => openEdit(course)} className="flex-1 flex items-center justify-center gap-1.5 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                  <PencilSimple size={16} /> Edit Details
                </button>
                <button onClick={() => setDeleteId(course.id)} className="w-10 flex items-center justify-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:border-red-900/50 dark:hover:text-red-400 text-slate-400 px-3 py-2.5 rounded-xl transition-all shadow-sm hover:shadow">
                  <Trash size={16} />
                </button>
              </div>
              {course.status === 'rejected' && (
                <button
                  onClick={() => handleResubmit(course.id)}
                  className="w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold transition-colors"
                >
                  Re-submit for Review
                </button>
              )}
            </div>
          </div>
        )})}

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
            <motion.form onSubmit={handleSubmit(onSave)} initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-[32px] w-full max-w-4xl h-[90vh] overflow-hidden border border-slate-100 dark:border-neutral-800 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{modalType === 'add' ? 'Propose New Course' : 'Edit Course Details'}</h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">Fill in the comprehensive details to match the main website structure.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalType(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>

              {/* Tab Navigation */}
              <div className="px-8 pt-4 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 flex gap-6 flex-shrink-0 overflow-x-auto">
                <button type="button" onClick={() => setFormTab('basic')} className={formTab === 'basic' ? "pb-3 border-b-2 border-violet-600 text-violet-600 font-bold text-sm whitespace-nowrap transition-colors" : "pb-3 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap transition-colors"}>Basic Info</button>
                <button type="button" onClick={() => setFormTab('logistics')} className={formTab === 'logistics' ? "pb-3 border-b-2 border-violet-600 text-violet-600 font-bold text-sm whitespace-nowrap transition-colors" : "pb-3 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap transition-colors"}>Logistics & Media</button>
                <button type="button" onClick={() => setFormTab('curriculum')} className={formTab === 'curriculum' ? "pb-3 border-b-2 border-violet-600 text-violet-600 font-bold text-sm whitespace-nowrap transition-colors" : "pb-3 border-b-2 border-transparent text-slate-500 font-medium text-sm hover:text-slate-700 dark:hover:text-slate-300 whitespace-nowrap transition-colors"}>Curriculum Builder</button>
              </div>
              
              <div className="p-8 bg-slate-50/50 dark:bg-neutral-900/50 overflow-y-auto flex-1">
                
                {formTab === 'basic' && (
                  <div className="max-w-2xl space-y-6">
                    <Field label="Course Title"><Input register={register} name="title" placeholder="e.g. General English Mastery: Live Interactive Cohort" /></Field>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <Field label="Category">
                        <select {...register('category')} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors shadow-sm">
                          <option value="Live Class">Live Class</option>
                          <option value="Recorded Course">Recorded Course</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </Field>
                      <Field label="Language"><Input register={register} name="language" placeholder="e.g. English" /></Field>
                    </div>

                    <Field label="Description">
                      <textarea {...register('description')} rows={4} placeholder="Describe what students will learn and how the course is structured..." className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 transition-colors resize-none shadow-sm" />
                    </Field>

                    <Field label="What You Will Learn (One per line)">
                      <textarea {...register('whatYouWillLearn')} rows={5} placeholder="Participate confidently in live conversations&#10;Receive real-time feedback&#10;Build robust vocabulary" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-violet-500 transition-colors resize-none shadow-sm leading-relaxed" />
                    </Field>
                  </div>
                )}

                {formTab === 'logistics' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-w-4xl">
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-neutral-800 pb-2">Logistics</h4>
                      <Field label="Level">
                        <select {...register('level')} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors shadow-sm">
                          {['Beginner', 'Beginner to Intermediate', 'Intermediate', 'Advanced', 'Business', 'Kids'].map(l => <option key={l}>{l}</option>)}
                        </select>
                      </Field>
                      
                      <Field label="Duration"><Input register={register} name="duration" placeholder="e.g. 12 Weeks (24 Live Sessions)" /></Field>
                      <Field label="Start Date"><Input register={register} name="startDate" placeholder="e.g. May 10, 2026" /></Field>
                      <Field label="Class Schedule"><Input register={register} name="schedule" placeholder="e.g. Tuesdays & Thursdays, 7:00 PM EST" /></Field>
                      <Field label="Platform"><Input register={register} name="platform" placeholder="e.g. Zoom / Google Meet" /></Field>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Total Classes"><Input register={register} name="totalClasses" type="number" placeholder="24" valueAsNumber /></Field>
                        <Field label="Max Students"><Input register={register} name="maxStudents" type="number" placeholder="25" valueAsNumber /></Field>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-neutral-800 pb-2">Media & Assets</h4>
                      <Field label="Cover Image URL"><Input register={register} name="image" placeholder="https://images.unsplash.com/..." type="url" /></Field>
                      <Field label="Video Preview URL"><Input register={register} name="videoPreview" placeholder="https://youtube.com/..." type="url" /></Field>

                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-neutral-800 pb-2 mt-8">Pricing & Status</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Selling Price"><Input register={register} name="price" placeholder="e.g. $299" /></Field>
                        <Field label="Original Price"><Input register={register} name="originalPrice" placeholder="e.g. $399" /></Field>
                      </div>

                      <Field label="Course Status">
                        <select {...register('status')} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors shadow-sm">
                          {['active', 'upcoming', 'draft'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </Field>
                      
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3">
                        <CheckCircle size={20} className="text-blue-500 shrink-0" weight="fill" />
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          This comprehensive data will perfectly map to the main website's single course view page once approved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'curriculum' && (
                  <div className="max-w-4xl space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Course Modules & Lessons</h4>
                        <p className="text-xs text-slate-500 mt-1">Structure your course week-by-week or topic-by-topic.</p>
                      </div>
                      <button type="button" onClick={handleAddModule} className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors">
                        <Plus size={14} weight="bold" /> Add Module
                      </button>
                    </div>

                    <div className="space-y-6">
                      {currentCurriculum.map((module, mIndex) => (
                        <div key={module.id} className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-2xl p-5 shadow-sm">
                           {/* Module Header */}
                           <div className="flex gap-4 items-start mb-4">
                             <div className="flex-1 space-y-4">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                 <Field label={`Module ${mIndex + 1} Title`}>
                                   <input type="text" value={module.title} onChange={e => handleUpdateModule(mIndex, 'title', e.target.value)} placeholder="e.g. Week 1-3: The Foundations of English" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-sm outline-none focus:border-violet-500" />
                                 </Field>
                                 <Field label="Duration (Optional)">
                                   <input type="text" value={module.duration} onChange={e => handleUpdateModule(mIndex, 'duration', e.target.value)} placeholder="e.g. 9 Hours Live" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-900 text-sm outline-none focus:border-violet-500" />
                                 </Field>
                               </div>
                             </div>
                             <button type="button" onClick={() => handleRemoveModule(mIndex)} className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center shrink-0 mt-6 transition-colors">
                               <Trash size={16} />
                             </button>
                           </div>

                           {/* Lessons */}
                           <div className="pl-2 sm:pl-6 border-l-2 border-slate-100 dark:border-neutral-700 space-y-3 mt-4">
                             {module.items.map((lesson, lIndex) => (
                               <div key={lesson.id} className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-100 dark:border-neutral-800 flex gap-3 items-start relative group">
                                 <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                                   <div className="lg:col-span-5">
                                     <input type="text" value={lesson.title} onChange={e => handleUpdateLesson(mIndex, lIndex, 'title', e.target.value)} placeholder="Lesson Title (e.g. Orientation)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none focus:border-violet-500" />
                                   </div>
                                   <div className="lg:col-span-2">
                                     <input type="text" value={lesson.date} onChange={e => handleUpdateLesson(mIndex, lIndex, 'date', e.target.value)} placeholder="Date (May 10)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none focus:border-violet-500" />
                                   </div>
                                   <div className="lg:col-span-2">
                                     <input type="text" value={lesson.time} onChange={e => handleUpdateLesson(mIndex, lIndex, 'time', e.target.value)} placeholder="Time (7:00 PM)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none focus:border-violet-500" />
                                   </div>
                                   <div className="lg:col-span-2">
                                     <select value={lesson.type} onChange={e => handleUpdateLesson(mIndex, lIndex, 'type', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs outline-none focus:border-violet-500">
                                       <option value="live">Live</option>
                                       <option value="video">Video</option>
                                       <option value="quiz">Quiz</option>
                                     </select>
                                   </div>
                                   <div className="lg:col-span-1 flex items-center justify-center pt-2 lg:pt-0">
                                     <label className="flex flex-col items-center cursor-pointer">
                                       <span className="text-[9px] font-bold text-slate-400 mb-1">Preview?</span>
                                       <input type="checkbox" checked={lesson.isFree} onChange={e => handleUpdateLesson(mIndex, lIndex, 'isFree', e.target.checked)} className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500" />
                                     </label>
                                   </div>
                                 </div>
                                 <button type="button" onClick={() => handleRemoveLesson(mIndex, lIndex)} className="w-6 h-6 absolute -right-2 -top-2 bg-white dark:bg-neutral-800 rounded-full border border-slate-200 dark:border-neutral-700 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                                   <X size={12} weight="bold" />
                                 </button>
                               </div>
                             ))}
                             <button type="button" onClick={() => handleAddLesson(mIndex)} className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5 hover:underline py-2 ml-2">
                               <Plus size={12} weight="bold" /> Add Lesson / Session
                             </button>
                           </div>
                        </div>
                      ))}
                      {currentCurriculum.length === 0 && (
                        <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700">
                          <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">No curriculum modules added yet.</p>
                          <button type="button" onClick={handleAddModule} className="mt-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors inline-flex items-center gap-2">
                            <Plus size={16} weight="bold" /> Create First Module
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 px-8 py-6 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-b-[32px] flex-shrink-0">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm font-bold text-slate-700 dark:text-neutral-300 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-colors">
                  <Check size={18} weight="bold" /> {modalType === 'add' ? 'Submit Course Proposal' : 'Save Course Details'}
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