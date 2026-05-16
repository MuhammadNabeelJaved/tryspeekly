import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { liveClassService } from '@/services/live-class.service'
import { coursesService } from '@/services/courses.service'
import { Users, Clock, PlayCircle, X, Check, PencilSimple, Trash, ListDashes, DotsThreeVertical, CaretUp, CaretDown, VideoCamera, FilePdf, PresentationChart, ShareNetwork, CheckCircle, MagnifyingGlass } from '@phosphor-icons/react'

type InstructorCourse = {
  _id: string
  id: string
  title: string
  students: number
  status: string
  nextClass: string
  progress: number
  level?: string
  duration?: string
  description?: string
  liveLink?: string
  isLive?: boolean
  totalClasses?: number
  maxStudents?: number
  totalSessions?: number
}

type ActiveLiveClass = {
  _id: string
  courseId: string
  courseTitle: string
  meetingLink: string
  classNumber: number
  createdAt: string
}

type CompletedClass = {
  _id: string
  id: string
  courseId: string
  courseTitle: string
  completedAt: string
  timestamp: number
  link: string
  classNumber: number
}

type SharedMaterial = {
  id: string
  courseId: string
  title: string
  link: string
  sharedAt: string
}

type SyllabusTopic = {
  id: string
  courseId: string
  week: number
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
}

export default function InstructorLiveClasses() {
  const [courses, setCourses] = useState<InstructorCourse[]>([])
  const [mainSearchTerm, setMainSearchTerm] = useState('')
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  
  // Live Class State
  const [liveModalCourse, setLiveModalCourse] = useState<InstructorCourse | null>(null)
  const [liveUrlInput, setLiveUrlInput] = useState('')
  const [liveUrlError, setLiveUrlError] = useState('')
  const [currentLiveClassId, setCurrentLiveClassId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Schedule State
  const [scheduleModalCourse, setScheduleModalCourse] = useState<InstructorCourse | null>(null)
  const [scheduleInput, setScheduleInput] = useState('')

  // Live Class History
  const [completedClasses, setCompletedClasses] = useState<CompletedClass[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [historySortBy, setHistorySortBy] = useState<'newest' | 'oldest' | 'class-asc' | 'class-desc'>('newest')
  const [historyFilterCourse, setHistoryFilterCourse] = useState('all')
  
  // History editing / options
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null)
  const [editingHistoryClass, setEditingHistoryClass] = useState<CompletedClass | null>(null)

  // Share Material Modal
  const [shareMaterialOpen, setShareMaterialOpen] = useState<string | null>(null)
  
  // Shared Materials History
  const [sharedMaterials, setSharedMaterials] = useState<SharedMaterial[]>([
    { id: 'sm_1', courseId: 'c1', title: 'Week 1 Grammar Slides', link: 'https://drive.google.com/open?id=123', sharedAt: new Date(Date.now() - 86400000).toLocaleString() }
  ])
  const [materialTitleInput, setMaterialTitleInput] = useState('')
  const [materialLinkInput, setMaterialLinkInput] = useState('')
  const [editingMaterial, setEditingMaterial] = useState<SharedMaterial | null>(null)
  const [activeMaterialDropdownId, setActiveMaterialDropdownId] = useState<string | null>(null)

  // Syllabus Modal State
  const [syllabusOpen, setSyllabusOpen] = useState<string | null>(null)
  const [syllabusTopics, setSyllabusTopics] = useState<SyllabusTopic[]>([
    { id: 'st_1', courseId: 'c1', week: 1, title: 'Introduction to IELTS', description: 'Overview of the exam format and scoring system.', status: 'completed' },
    { id: 'st_2', courseId: 'c1', week: 2, title: 'Listening Strategies', description: 'Techniques for multiple choice and matching questions.', status: 'in-progress' }
  ])
  const [editingSyllabus, setEditingSyllabus] = useState<SyllabusTopic | null>(null)
  const [syllabusWeekInput, setSyllabusWeekInput] = useState<number>(1)
  const [syllabusTitleInput, setSyllabusTitleInput] = useState('')
  const [syllabusDescInput, setSyllabusDescInput] = useState('')
  const [syllabusStatusInput, setSyllabusStatusInput] = useState<'pending' | 'in-progress' | 'completed'>('pending')
  const [activeSyllabusDropdownId, setActiveSyllabusDropdownId] = useState<string | null>(null)

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null)
  const materialDropdownRef = useRef<HTMLDivElement>(null)
  const syllabusDropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null)
      }
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target as Node)) {
        setActiveMaterialDropdownId(null)
      }
      if (syllabusDropdownRef.current && !syllabusDropdownRef.current.contains(event.target as Node)) {
        setActiveSyllabusDropdownId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [dropdownRef, materialDropdownRef, syllabusDropdownRef])

  // Fetch courses and active live classes from API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingCourses(true)

        const [coursesRes, liveClassesRes] = await Promise.all([
          coursesService.getTeacherCourses(),
          liveClassService.getTeacherLiveClasses()
        ])

        if (coursesRes.success && coursesRes.data) {
          const activeCourses = coursesRes.data.filter((c: { status: string }) => c.status === 'published' || c.status === 'active')

          const activeLiveClasses = liveClassesRes.data?.filter((lc: { status: string }) => lc.status === 'active') || []
          const completedLiveClasses = liveClassesRes.data?.filter((lc: { status: string }) => lc.status === 'completed') || []

          // Set completed classes for history
          const mappedCompleted: CompletedClass[] = completedLiveClasses.map((lc: { _id: string; course: { _id: string; title: string }; meetingLink: string; classNumber: number; createdAt: string }) => ({
            _id: lc._id,
            id: lc._id,
            courseId: String(lc.course._id),
            courseTitle: lc.course.title,
            completedAt: new Date(lc.createdAt).toLocaleString(),
            timestamp: new Date(lc.createdAt).getTime(),
            link: lc.meetingLink,
            classNumber: lc.classNumber,
          }))
          setCompletedClasses(mappedCompleted)

          const mappedCourses: InstructorCourse[] = activeCourses.map((course: { _id: string; title: string; enrolledStudents: unknown[]; status: string; totalSessions: number; level?: string; description?: string }) => {
            const courseIdStr = String(course._id)
            const liveClass = activeLiveClasses.find((lc: { course: { _id: string } }) => String(lc.course._id) === courseIdStr)
            return {
              _id: course._id,
              id: courseIdStr,
              title: course.title,
              students: course.enrolledStudents?.length || 0,
              status: course.status || 'active',
              nextClass: 'TBD',
              progress: 0,
              level: course.level,
              description: course.description,
              totalClasses: course.totalSessions,
              totalSessions: course.totalSessions,
              isLive: !!liveClass,
              liveLink: liveClass?.meetingLink || ''
            }
          })

          setCourses(mappedCourses)

          if (activeLiveClasses.length > 0) {
            setCurrentLiveClassId(activeLiveClasses[0]._id)
          }
        }
      } catch {
        toast.error('Failed to load courses')
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchData()
  }, [])

  // Fetch completed classes from database
  useEffect(() => {
    async function fetchCompletedClasses() {
      if (!historyModalOpen) return

      setIsLoadingHistory(true)
      try {
        const response = await liveClassService.getTeacherCompletedClasses()
        if (response.success && response.data) {
          const mapped: CompletedClass[] = response.data.map((lc: { _id: string; course: { _id: string; title: string }; meetingLink: string; classNumber: number; createdAt: string }) => ({
            _id: lc._id,
            id: lc._id,
            courseId: lc.course._id,
            courseTitle: lc.course.title,
            completedAt: new Date(lc.createdAt).toLocaleString(),
            timestamp: new Date(lc.createdAt).getTime(),
            link: lc.meetingLink,
            classNumber: lc.classNumber,
          }))
          setCompletedClasses(mapped)
        }
      } catch {
        toast.error('Failed to load class history')
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchCompletedClasses()
  }, [historyModalOpen])

  // Live Class Handlers
  function openLiveModal(course: InstructorCourse) {
    setLiveModalCourse(course)
    setLiveUrlInput(course.liveLink || '')
    setLiveUrlError('')
  }

  async function handleStartLive() {
    if (!liveModalCourse) return

    if (!liveUrlInput.trim()) {
      setLiveUrlError('Please provide a meeting link.')
      return
    }

    if (!liveUrlInput.includes('zoom.us') && !liveUrlInput.includes('meet.google.com')) {
      setLiveUrlError('Please provide a valid Zoom or Google Meet link.')
      return
    }

    if (completedClasses.some(c => c.link === liveUrlInput)) {
      setLiveUrlError('This link has already been used for a completed class. Please provide a new link.')
      return
    }

    setLiveUrlError('')
    setIsLoading(true)

    try {
      const courseId = liveModalCourse._id || liveModalCourse.id
      const completedCount = completedClasses.filter(c => c.courseId === liveModalCourse.id).length

      const response = await liveClassService.startLiveClass({
        courseId,
        meetingLink: liveUrlInput,
        classNumber: completedCount + 1,
      })

      if (response.success) {
        setCurrentLiveClassId(response.data._id)
        setCourses(courses.map(c =>
          c.id === liveModalCourse.id
            ? { ...c, isLive: true, liveLink: liveUrlInput }
            : c
        ))
        toast.success('Live class started! Enrolled students have been notified.')
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to start live class')
    } finally {
      setIsLoading(false)
      setLiveModalCourse(null)
    }
  }

  async function handleUpdateLive() {
    if (!liveModalCourse || !liveUrlInput || !currentLiveClassId) return

    if (!liveUrlInput.trim()) {
      setLiveUrlError('Please provide a meeting link.')
      return
    }

    if (!liveUrlInput.includes('zoom.us') && !liveUrlInput.includes('meet.google.com')) {
      setLiveUrlError('Please provide a valid Zoom or Google Meet link.')
      return
    }

    if (completedClasses.some(c => c.link === liveUrlInput)) {
      setLiveUrlError('This link has already been used for a completed class. Please provide a new link.')
      return
    }

    setLiveUrlError('')
    setIsLoading(true)

    try {
      await liveClassService.updateLiveClass(currentLiveClassId, liveUrlInput)

      setCourses(courses.map(c =>
        c.id === liveModalCourse.id
          ? { ...c, liveLink: liveUrlInput }
          : c
      ))

      setLiveModalCourse({ ...liveModalCourse, liveLink: liveUrlInput })
      toast.success("Live class link updated successfully!")
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to update live class')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCompleteLive() {
    if (!liveModalCourse || !currentLiveClassId) return

    if (!liveUrlInput.trim()) {
      setLiveUrlError('Please provide a meeting link to mark as completed.')
      return
    }

    if (!liveUrlInput.includes('zoom.us') && !liveUrlInput.includes('meet.google.com')) {
      setLiveUrlError('Please provide a valid Zoom or Google Meet link.')
      return
    }

    if (completedClasses.some(c => c.link === liveUrlInput)) {
      setLiveUrlError('This link has already been used for a completed class. Please provide a new link.')
      return
    }

    setLiveUrlError('')
    setIsLoading(true)

    try {
      await liveClassService.completeLiveClass(currentLiveClassId)

      const courseHistory = completedClasses.filter(c => c.courseId === liveModalCourse.id)

      const newRecord: CompletedClass = {
        _id: `hc_${Date.now()}`,
        id: `hc_${Date.now()}`,
        courseId: liveModalCourse._id || liveModalCourse.id,
        courseTitle: liveModalCourse.title,
        completedAt: new Date().toLocaleString(),
        timestamp: Date.now(),
        link: liveUrlInput,
        classNumber: courseHistory.length + 1
      }
      setCompletedClasses([newRecord, ...completedClasses])

      setCourses(courses.map(c =>
        c.id === liveModalCourse.id
          ? { ...c, isLive: false, liveLink: '' }
          : c
      ))
      setCurrentLiveClassId(null)
      toast.success('Live class marked as completed!')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to complete live class')
    } finally {
      setIsLoading(false)
      setLiveModalCourse(null)
    }
  }

  async function handleCancelLive() {
    if (!liveModalCourse || !currentLiveClassId) return

    setIsLoading(true)
    try {
      await liveClassService.cancelLiveClass(currentLiveClassId)

      setCourses(courses.map(c =>
        c.id === liveModalCourse.id
          ? { ...c, isLive: false, liveLink: '' }
          : c
      ))
      setCurrentLiveClassId(null)
      toast.success('Live session cancelled')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || 'Failed to cancel live class')
    } finally {
      setIsLoading(false)
      setLiveModalCourse(null)
    }
  }

  // Schedule Handlers
  function openScheduleModal(course: InstructorCourse) {
    setScheduleModalCourse(course)
    setScheduleInput(course.nextClass !== 'TBD' ? course.nextClass : '')
  }

  function handleSaveSchedule() {
    if (!scheduleModalCourse) return
    const updatedValue = scheduleInput.trim() || 'TBD'
    setCourses(courses.map(c => c.id === scheduleModalCourse.id ? { ...c, nextClass: updatedValue } : c))
    setScheduleModalCourse(null)
  }

  function handleRemoveSchedule() {
    if (!scheduleModalCourse) return
    setCourses(courses.map(c => c.id === scheduleModalCourse.id ? { ...c, nextClass: 'TBD' } : c))
    setScheduleModalCourse(null)
  }

  // History Edit Handlers
  function handleDeleteHistory(id: string) {
    setCompletedClasses(completedClasses.filter(c => c.id !== id))
    setActiveDropdownId(null)
  }

  function handleMoveHistory(index: number, direction: 'up' | 'down') {
    const newClasses = [...completedClasses]
    if (direction === 'up' && index > 0) {
      const temp = newClasses[index]
      newClasses[index] = newClasses[index - 1]
      newClasses[index - 1] = temp
      
      const tempNum = newClasses[index].classNumber
      newClasses[index].classNumber = newClasses[index - 1].classNumber
      newClasses[index - 1].classNumber = tempNum
    } else if (direction === 'down' && index < newClasses.length - 1) {
      const temp = newClasses[index]
      newClasses[index] = newClasses[index + 1]
      newClasses[index + 1] = temp
      
      const tempNum = newClasses[index].classNumber
      newClasses[index].classNumber = newClasses[index + 1].classNumber
      newClasses[index + 1].classNumber = tempNum
    }
    setCompletedClasses(newClasses)
    setActiveDropdownId(null)
  }

  // Shared Material Handlers
  function handleShareMaterial() {
    if (!shareMaterialOpen) return
    if (!materialTitleInput.trim() || !materialLinkInput.trim()) {
      toast.error("Please provide both title and link.")
      return
    }

    if (editingMaterial) {
      setSharedMaterials(sharedMaterials.map(m =>
        m.id === editingMaterial.id
          ? { ...m, title: materialTitleInput, link: materialLinkInput }
          : m
      ))
      setEditingMaterial(null)
      toast.success('Material updated successfully!')
    } else {
      const newMaterial: SharedMaterial = {
        id: `sm_${Date.now()}`,
        courseId: shareMaterialOpen,
        title: materialTitleInput,
        link: materialLinkInput,
        sharedAt: new Date().toLocaleString()
      }
      setSharedMaterials([newMaterial, ...sharedMaterials])
      toast.success('Materials shared and students notified!')
    }
    
    setMaterialTitleInput('')
    setMaterialLinkInput('')
  }

  function handleEditMaterial(material: SharedMaterial) {
    setEditingMaterial(material)
    setMaterialTitleInput(material.title)
    setMaterialLinkInput(material.link)
    setActiveMaterialDropdownId(null)
  }

  function handleDeleteMaterial(id: string) {
    setSharedMaterials(sharedMaterials.filter(m => m.id !== id))
    setActiveMaterialDropdownId(null)
    toast.success('Material deleted.')
  }

  // Syllabus Handlers
  function handleSyllabusSubmit() {
    if (!syllabusOpen) return
    if (!syllabusTitleInput.trim() || !syllabusDescInput.trim()) {
      toast.error("Please provide both title and description.")
      return
    }

    if (editingSyllabus) {
      setSyllabusTopics(syllabusTopics.map(t =>
        t.id === editingSyllabus.id
          ? { ...t, week: syllabusWeekInput, title: syllabusTitleInput, description: syllabusDescInput, status: syllabusStatusInput }
          : t
      ))
      setEditingSyllabus(null)
      toast.success('Syllabus topic updated successfully!')
    } else {
      const newTopic: SyllabusTopic = {
        id: `st_${Date.now()}`,
        courseId: syllabusOpen,
        week: syllabusWeekInput,
        title: syllabusTitleInput,
        description: syllabusDescInput,
        status: syllabusStatusInput
      }
      setSyllabusTopics([...syllabusTopics, newTopic].sort((a, b) => a.week - b.week))
      toast.success('Syllabus topic added!')
    }
    
    setSyllabusWeekInput(1)
    setSyllabusTitleInput('')
    setSyllabusDescInput('')
    setSyllabusStatusInput('pending')
  }

  function handleEditSyllabus(topic: SyllabusTopic) {
    setEditingSyllabus(topic)
    setSyllabusWeekInput(topic.week)
    setSyllabusTitleInput(topic.title)
    setSyllabusDescInput(topic.description)
    setSyllabusStatusInput(topic.status)
    setActiveSyllabusDropdownId(null)
  }

  function handleDeleteSyllabus(id: string) {
    setSyllabusTopics(syllabusTopics.filter(t => t.id !== id))
    setActiveSyllabusDropdownId(null)
    toast.success('Syllabus topic deleted.')
  }

  const filteredMainCourses = courses.filter(c => 
    c.title.toLowerCase().includes(mainSearchTerm.toLowerCase())
  )

  // Group classes by course for the history view
  const filteredHistory = completedClasses
    .filter(cls => {
      const search = historySearchTerm.toLowerCase();
      const matchesSearch = (
        cls.courseTitle.toLowerCase().includes(search) ||
        cls.completedAt.toLowerCase().includes(search) ||
        cls.link.toLowerCase().includes(search) ||
        cls.classNumber?.toString().includes(search)
      );
      
      const matchesCourse = historyFilterCourse === 'all' || cls.courseId === historyFilterCourse;
      
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      if (historySortBy === 'newest') return b.timestamp - a.timestamp;
      if (historySortBy === 'oldest') return a.timestamp - b.timestamp;
      if (historySortBy === 'class-asc') return (a.classNumber || 0) - (b.classNumber || 0);
      if (historySortBy === 'class-desc') return (b.classNumber || 0) - (a.classNumber || 0);
      return 0;
    });

  const groupedHistory = filteredHistory.reduce((acc, cls) => {
    if (!acc[cls.courseId]) {
      acc[cls.courseId] = {
        title: cls.courseTitle,
        classes: []
      }
    }
    acc[cls.courseId].classes.push(cls)
    return acc
  }, {} as Record<string, { title: string, classes: CompletedClass[] }>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Live Classes Workspace</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Launch classes, share materials, and track history.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative group w-full sm:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
            <input 
              type="text" 
              value={mainSearchTerm}
              onChange={(e) => setMainSearchTerm(e.target.value)}
              placeholder="Search active courses..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs focus:border-violet-500 outline-none transition-all shadow-sm"
            />
            {mainSearchTerm && (
              <button 
                onClick={() => setMainSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={10} weight="bold" />
              </button>
            )}
          </div>
          <button onClick={() => setHistoryModalOpen(true)} className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 text-slate-900 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm self-start sm:self-auto">
            <ListDashes size={18} weight="bold" />
            Class History
          </button>
        </div>
      </div>

      {isLoadingCourses ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Loading your courses...</p>
          </div>
        </div>
      ) : filteredMainCourses.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoCamera size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Courses</h3>
          <p className="text-sm text-slate-500 dark:text-neutral-400">You don't have any published courses yet. Create a course to start live classes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMainCourses.map(course => (
          <div key={course.id} className={`bg-white dark:bg-neutral-900 rounded-3xl border ${course.isLive ? 'border-red-200 dark:border-red-900/50 shadow-red-100 dark:shadow-red-900/20 shadow-lg scale-[1.01]' : 'border-slate-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700'} overflow-hidden flex flex-col transition-all duration-300 relative`}>
            
            {/* Live Indicator Pulse Background */}
            {course.isLive && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/20 dark:bg-red-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse" />
            )}

            <div className="p-6 flex-1 relative z-10">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-14 h-14 ${course.isLive ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30' : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'} rounded-2xl flex items-center justify-center transition-colors`}>
                  <VideoCamera size={28} weight={course.isLive ? 'fill' : 'duotone'} />
                </div>
                
                {course.isLive ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Live Now
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-full">
                    <Clock size={14} weight="bold" /> Upcoming
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                {course.title}
              </h3>
              
              <div className="space-y-3 mt-5">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-neutral-300 bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-xl border border-slate-100 dark:border-neutral-800 group/schedule">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center shrink-0">
                    <Clock size={18} weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Next Class</p>
                    <p className="font-semibold truncate">{course.nextClass !== 'TBD' ? course.nextClass : 'Not Scheduled'}</p>
                  </div>
                  <button 
                    onClick={() => openScheduleModal(course)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 dark:hover:text-violet-400 transition-colors"
                    title="Edit Schedule"
                  >
                    <PencilSimple size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-neutral-400 px-1">
                  <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span className="font-medium">{course.students} Enrolled</span>
                  </div>
                  {course.totalClasses && (() => {
                    const courseId = (course.id || course._id || '').toString().trim();
                    const completed = completedClasses.filter(cc => (cc.courseId || '').toString().trim() === courseId).length;
                    const isAllCompleted = completed >= course.totalClasses;

                    return (
                      <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md text-xs border ${isAllCompleted ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-neutral-800/80 text-violet-600 dark:text-violet-400 border-slate-200 dark:border-neutral-700'}`}>
                        {isAllCompleted ? <CheckCircle size={14} weight="fill" /> : <ListDashes size={14} weight="bold" />}
                        {completed} / {course.totalClasses} Completed
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* Quick Actions Bar */}
            <div className="px-6 pb-4 pt-2 bg-gradient-to-b from-transparent to-white dark:to-neutral-900 relative z-10 flex gap-2">
               <button 
                  onClick={() => setShareMaterialOpen(course.id)}
                  className="flex-1 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
               >
                 <ShareNetwork size={16} /> Share Material
               </button>
               <button 
                 onClick={() => setSyllabusOpen(course.id)}
                 className="flex-1 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
               >
                 <PresentationChart size={16} /> Syllabus
               </button>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/30 relative z-10">
              <button 
                onClick={() => openLiveModal(course)} 
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all shadow-md ${
                  course.isLive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                    : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20'
                }`}
              >
                {course.isLive ? (
                  <>Manage Active Live Class</>
                ) : (
                  <><PlayCircle size={20} weight="fill" /> Start Live Class</>
                )}
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* SHARE MATERIAL MODAL */}
      <AnimatePresence>
        {shareMaterialOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex-shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                     <FilePdf size={20} weight="fill" />
                   </div>
                   <div>
                     <h3 className="font-black text-slate-900 dark:text-white leading-none">Share Class Material</h3>
                     <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Manage and track resources for this course.</p>
                   </div>
                 </div>
                 <button onClick={() => {
                   setShareMaterialOpen(null);
                   setEditingMaterial(null);
                   setMaterialTitleInput('');
                   setMaterialLinkInput('');
                 }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X size={15} /></button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
                 {/* Share Form */}
                 <div className="space-y-4 bg-slate-50 dark:bg-neutral-800/30 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800">
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     {editingMaterial ? <><PencilSimple size={16} className="text-violet-500" /> Edit Material</> : <><ShareNetwork size={16} className="text-violet-500" /> Share New Material</>}
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Material Title</label>
                       <input type="text" value={materialTitleInput} onChange={e => setMaterialTitleInput(e.target.value)} placeholder="e.g., Week 1 Grammar Slides" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors" />
                     </div>
                     <div>
                       <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Google Drive / File Link</label>
                       <input type="url" value={materialLinkInput} onChange={e => setMaterialLinkInput(e.target.value)} placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors" />
                     </div>
                   </div>
                   <div className="flex gap-3 pt-2">
                     {editingMaterial && (
                       <button onClick={() => { setEditingMaterial(null); setMaterialTitleInput(''); setMaterialLinkInput(''); }} className="px-6 py-2.5 bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all">
                         Cancel Edit
                       </button>
                     )}
                     <button onClick={handleShareMaterial} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2">
                       {editingMaterial ? <><Check size={16} /> Update Material</> : <><ShareNetwork size={16} /> Share & Notify Students</>}
                     </button>
                   </div>
                 </div>

                 {/* History List */}
                 <div>
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <ListDashes size={16} className="text-slate-400" /> Previously Shared Materials
                   </h4>
                   
                   {sharedMaterials.filter(m => m.courseId === shareMaterialOpen).length === 0 ? (
                     <div className="text-center py-8 bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-slate-100 border-dashed dark:border-neutral-800">
                       <FilePdf size={24} className="mx-auto text-slate-300 mb-2" />
                       <p className="text-sm font-medium text-slate-500">No materials shared yet.</p>
                     </div>
                   ) : (
                     <div className="space-y-3" ref={materialDropdownRef}>
                       {sharedMaterials.filter(m => m.courseId === shareMaterialOpen).map((material) => (
                         <div key={material.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/30 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors shadow-sm">
                           <div className="flex items-start gap-3">
                             <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex flex-shrink-0 items-center justify-center">
                               <FilePdf size={18} weight="fill" />
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{material.title}</p>
                               <div className="flex items-center gap-3 text-xs text-slate-500">
                                 <span className="flex items-center gap-1"><Clock size={12} /> {material.sharedAt}</span>
                                 <a href={material.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline flex items-center gap-1">
                                   <ShareNetwork size={12} /> Open Link
                                 </a>
                               </div>
                             </div>
                           </div>
                           
                           <div className="relative">
                             <button 
                               onClick={() => setActiveMaterialDropdownId(activeMaterialDropdownId === material.id ? null : material.id)}
                               className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-neutral-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                             >
                               <DotsThreeVertical size={16} weight="bold" />
                             </button>
                             <AnimatePresence>
                               {activeMaterialDropdownId === material.id && (
                                 <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }} className="absolute right-0 top-10 w-36 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden z-20">
                                   <button 
                                     onClick={() => handleEditMaterial(material)} 
                                     className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-slate-700 dark:text-neutral-300"
                                   >
                                     <PencilSimple size={14} /> Edit
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteMaterial(material.id)} 
                                     className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                                   >
                                     <Trash size={14} /> Delete
                                   </button>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE CLASS MODAL */}
      <AnimatePresence>
        {liveModalCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-md border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${liveModalCourse.isLive ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-slate-300 dark:bg-neutral-600'}`} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {liveModalCourse.isLive ? 'Manage Live Session' : 'Start Live Session'}
                  </h3>
                </div>
                <button type="button" onClick={() => setLiveModalCourse(null)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
              </div>
              
              <div className="p-6">
                <div className="mb-6 bg-violet-50 dark:bg-violet-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-900/20">
                  <p className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-1">{liveModalCourse.title}</p>
                  <p className="text-xs text-violet-600 dark:text-violet-300">
                    {liveModalCourse.isLive 
                      ? 'Session is currently active. Students can see the Join button.' 
                      : 'Provide your meeting link. We will notify enrolled students instantly.'}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">Meeting Link (Zoom / Meet)</label>
                  <input 
                    type="url"
                    value={liveUrlInput}
                    onChange={(e) => {
                      setLiveUrlInput(e.target.value)
                      setLiveUrlError('')
                    }}
                    placeholder="https://zoom.us/j/..."
                    className={`w-full px-4 py-3 rounded-xl border ${liveUrlError ? 'border-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-neutral-700 focus:border-violet-500'} bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none transition-colors`}
                  />
                  {liveUrlError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 mt-2 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{liveUrlError}</motion.p>
                  )}
                </div>

                {liveModalCourse.isLive ? (
                  <div className="space-y-3">
                    <button onClick={handleCompleteLive} className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
                      <Check size={18} weight="bold" /> Mark Class as Completed
                    </button>
                    <button onClick={handleUpdateLive} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors">
                      <PencilSimple size={18} /> Update Meeting Link
                    </button>
                    <div className="pt-2">
                       <button onClick={handleCancelLive} className="w-full py-2.5 rounded-xl bg-transparent hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                         <Trash size={16} /> Cancel Live Session
                       </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleStartLive} 
                    disabled={!liveUrlInput}
                    className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlayCircle size={20} weight="fill" /> Go Live Now
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCHEDULE MODAL */}
      <AnimatePresence>
        {scheduleModalCourse && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-sm p-6 border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center">
                  <Clock size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Update Schedule</h3>
                  <p className="text-xs text-slate-500 truncate w-48">{scheduleModalCourse.title}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Next Class (Day, Date & Time)</label>
                  <input 
                    type="text" 
                    value={scheduleInput} 
                    onChange={e => setScheduleInput(e.target.value)} 
                    placeholder="e.g. Tomorrow, 4:00 PM"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
                  />
                  <p className="text-[10px] text-slate-400 mt-2">This will be displayed to students on their dashboard.</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <button 
                  onClick={handleSaveSchedule} 
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Check size={16} /> Update Schedule
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setScheduleModalCourse(null)} 
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleRemoveSchedule} 
                    className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash size={14} /> Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPLETED CLASSES HISTORY MODAL */}
      <AnimatePresence>
        {historyModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-[95vw] md:max-w-4xl lg:max-w-5xl h-[90vh] md:h-[85vh] flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                    <ListDashes size={20} weight="bold" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">Class History</h3>
                     <p className="text-xs text-slate-500 mt-1">Review past live sessions and links</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setHistoryModalOpen(false); setHistorySearchTerm(''); setHistoryFilterCourse('all'); setHistorySortBy('newest'); }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X size={15} /></button>
              </div>
              
              {/* Search & Filters Bar */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex-shrink-0 space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors">
                    <MagnifyingGlass size={20} weight="bold" />
                  </div>
                  <input 
                    type="text" 
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    placeholder="Search by date, course, link, or class number..."
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 text-sm focus:bg-white dark:focus:bg-neutral-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 outline-none transition-all"
                  />
                  {historySearchTerm && (
                    <button 
                      onClick={() => setHistorySearchTerm('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter By:</span>
                    <select 
                      value={historyFilterCourse}
                      onChange={(e) => setHistoryFilterCourse(e.target.value)}
                      className="bg-slate-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                    >
                      <option value="all">All Courses</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort By:</span>
                    <select 
                      value={historySortBy}
                      onChange={(e) => setHistorySortBy(e.target.value as any)}
                      className="bg-slate-100 dark:bg-neutral-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                    >
                      <option value="newest">Recent Classes (Newest)</option>
                      <option value="oldest">Oldest Classes</option>
                      <option value="class-desc">Class Number (High to Low)</option>
                      <option value="class-asc">Class Number (Low to High)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                      <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">Loading class history...</p>
                    </div>
                  </div>
                ) : completedClasses.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-neutral-400 py-16">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <ListDashes size={24} className="opacity-50" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-neutral-300">No completed classes yet.</p>
                    <p className="text-xs mt-1">Your class history will appear here once you complete a live session.</p>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center text-slate-500 dark:text-neutral-400 py-16">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                       <MagnifyingGlass size={24} className="opacity-50" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-neutral-300">No matches found.</p>
                    <p className="text-xs mt-1">Try adjusting your search criteria.</p>
                  </div>
                ) : (
                  <div className="space-y-10" ref={dropdownRef}>
                    {Object.entries(groupedHistory).map(([courseId, group]) => (
                      <div key={courseId} className="space-y-4">
                        <div className="flex items-center gap-3 px-1 sticky top-0 bg-white dark:bg-neutral-900 py-2 z-10">
                          <div className="w-1 bg-violet-500 rounded-full h-6" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{group.title}</h4>
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-800/50">{group.classes.length} Sessions</span>
                        </div>
                        <div className="space-y-3">
                          {group.classes.map((cls) => {
                             const index = completedClasses.findIndex(c => c.id === cls.id);
                             return (
                               <div key={cls.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/30 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors gap-4 shadow-sm hover:shadow-md">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-neutral-800 flex flex-col items-center justify-center flex-shrink-0">
                                       <span className="text-[10px] text-slate-400 font-bold uppercase">Class</span>
                                       <span className="font-black text-slate-700 dark:text-neutral-300 leading-none">#{cls.classNumber}</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{cls.courseTitle}</p>
                                      <p className="text-xs text-slate-500 dark:text-neutral-400 flex items-center gap-1.5">
                                        <CheckCircle size={14} className="text-green-500" /> Completed: {cls.completedAt}
                                      </p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 relative self-end sm:self-auto">
                                   {cls.link && (
                                     <a 
                                       href={cls.link} 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 dark:hover:bg-blue-600 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                                     >
                                       <VideoCamera size={14} weight="bold" /> View Link
                                     </a>
                                   )}
                                   
                                   <button 
                                     onClick={() => setActiveDropdownId(activeDropdownId === cls.id ? null : cls.id)}
                                     className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-neutral-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                                   >
                                     <DotsThreeVertical size={18} weight="bold" />
                                   </button>

                                   <AnimatePresence>
                                      {activeDropdownId === cls.id && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }} className="absolute right-0 top-10 w-40 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden z-20">
                                          <button 
                                            onClick={() => { setEditingHistoryClass(cls); setActiveDropdownId(null) }} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-slate-700 dark:text-neutral-300"
                                          >
                                            <PencilSimple size={14} /> Edit Record
                                          </button>
                                          <button 
                                            onClick={() => handleMoveHistory(index, 'up')} 
                                            disabled={index === 0} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-slate-700 dark:text-neutral-300 disabled:opacity-50"
                                          >
                                            <CaretUp size={14} /> Move Up
                                          </button>
                                          <button 
                                            onClick={() => handleMoveHistory(index, 'down')} 
                                            disabled={index === completedClasses.length - 1} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-slate-700 dark:text-neutral-300 disabled:opacity-50"
                                          >
                                            <CaretDown size={14} /> Move Down
                                          </button>
                                          <div className="h-px bg-slate-100 dark:bg-neutral-800 my-1" />
                                          <button 
                                            onClick={() => handleDeleteHistory(cls.id)} 
                                            className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                                          >
                                            <Trash size={14} /> Delete Record
                                          </button>
                                        </motion.div>
                                      )}
                                   </AnimatePresence>
                                 </div>
                               </div>
                             );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT HISTORY CLASS MODAL */}
      <AnimatePresence>
        {editingHistoryClass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-sm p-6 border border-slate-100 dark:border-neutral-800 shadow-2xl">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-5">Edit Record</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Class Number</label>
                  <input 
                    type="number" 
                    value={editingHistoryClass.classNumber || ''} 
                    onChange={e => setEditingHistoryClass({...editingHistoryClass, classNumber: parseInt(e.target.value) || 0})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Course Title</label>
                  <input 
                    type="text" 
                    value={editingHistoryClass.courseTitle} 
                    onChange={e => setEditingHistoryClass({...editingHistoryClass, courseTitle: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Meeting Link</label>
                  <input 
                    type="url" 
                    value={editingHistoryClass.link} 
                    onChange={e => setEditingHistoryClass({...editingHistoryClass, link: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Completion Date & Time</label>
                  <input 
                    type="text" 
                    value={editingHistoryClass.completedAt} 
                    onChange={e => setEditingHistoryClass({...editingHistoryClass, completedAt: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" 
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setEditingHistoryClass(null)} 
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setCompletedClasses(completedClasses.map(c => c.id === editingHistoryClass.id ? editingHistoryClass : c));
                    setEditingHistoryClass(null);
                  }} 
                  className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-md shadow-violet-600/20 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SYLLABUS MODAL */}
      <AnimatePresence>
        {syllabusOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden">
               <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 flex-shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                     <PresentationChart size={20} weight="fill" />
                   </div>
                   <div>
                     <h3 className="font-black text-slate-900 dark:text-white leading-none">Course Syllabus</h3>
                     <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Manage weekly topics and progress.</p>
                   </div>
                 </div>
                 <button onClick={() => {
                   setSyllabusOpen(null);
                   setEditingSyllabus(null);
                   setSyllabusWeekInput(1);
                   setSyllabusTitleInput('');
                   setSyllabusDescInput('');
                   setSyllabusStatusInput('pending');
                 }} className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"><X size={15} /></button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
                 {/* Add/Edit Form */}
                 <div className="space-y-4 bg-slate-50 dark:bg-neutral-800/30 p-5 rounded-2xl border border-slate-100 dark:border-neutral-800">
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     {editingSyllabus ? <><PencilSimple size={16} className="text-violet-500" /> Edit Topic</> : <><PresentationChart size={16} className="text-violet-500" /> Add New Topic</>}
                   </h4>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Week Number</label>
                       <input type="number" min="1" value={syllabusWeekInput} onChange={e => setSyllabusWeekInput(parseInt(e.target.value) || 1)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors" />
                     </div>
                     <div>
                       <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Topic Title</label>
                       <input type="text" value={syllabusTitleInput} onChange={e => setSyllabusTitleInput(e.target.value)} placeholder="e.g., Introduction to Tenses" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors" />
                     </div>
                   </div>
                   <div>
                     <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Description</label>
                     <textarea value={syllabusDescInput} onChange={e => setSyllabusDescInput(e.target.value)} placeholder="Brief overview of what will be covered..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors min-h-[80px]" />
                   </div>
                   <div>
                     <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">Status</label>
                     <select value={syllabusStatusInput} onChange={e => setSyllabusStatusInput(e.target.value as 'pending' | 'in-progress' | 'completed')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm outline-none focus:border-violet-500 transition-colors">
                       <option value="pending">Pending</option>
                       <option value="in-progress">In Progress</option>
                       <option value="completed">Completed</option>
                     </select>
                   </div>
                   <div className="flex gap-3 pt-2">
                     {editingSyllabus && (
                       <button onClick={() => { setEditingSyllabus(null); setSyllabusWeekInput(1); setSyllabusTitleInput(''); setSyllabusDescInput(''); setSyllabusStatusInput('pending'); }} className="px-6 py-2.5 bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 text-xs font-bold rounded-xl transition-all">
                         Cancel Edit
                       </button>
                     )}
                     <button onClick={handleSyllabusSubmit} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl shadow-md shadow-violet-600/20 transition-all flex items-center justify-center gap-2">
                       {editingSyllabus ? <><Check size={16} /> Update Topic</> : <><Plus size={16} /> Add Topic</>}
                     </button>
                   </div>
                 </div>

                 {/* Syllabus List */}
                 <div>
                   <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                     <ListDashes size={16} className="text-slate-400" /> Course Timeline
                   </h4>
                   
                   {syllabusTopics.filter(t => t.courseId === syllabusOpen).length === 0 ? (
                     <div className="text-center py-8 bg-slate-50 dark:bg-neutral-800/20 rounded-2xl border border-slate-100 border-dashed dark:border-neutral-800">
                       <PresentationChart size={24} className="mx-auto text-slate-300 mb-2" />
                       <p className="text-sm font-medium text-slate-500">No syllabus topics added yet.</p>
                     </div>
                   ) : (
                     <div className="space-y-4" ref={syllabusDropdownRef}>
                       {syllabusTopics.filter(t => t.courseId === syllabusOpen).map((topic) => (
                         <div key={topic.id} className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-px before:bg-slate-100 dark:before:bg-neutral-800 last:before:bottom-auto last:before:h-6">
                           <div className={`absolute left-0 top-6 w-6 h-6 rounded-full border-4 border-white dark:border-neutral-900 z-10 flex items-center justify-center ${
                             topic.status === 'completed' ? 'bg-green-500' : topic.status === 'in-progress' ? 'bg-violet-500' : 'bg-slate-200 dark:bg-neutral-700'
                           }`}>
                             {topic.status === 'completed' && <Check size={10} weight="bold" className="text-white" />}
                           </div>
                           
                           <div className="p-4 rounded-2xl border border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-800/30 hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors shadow-sm group">
                             <div className="flex justify-between items-start mb-2">
                               <div>
                                 <span className="text-[10px] font-black text-violet-500 uppercase tracking-wider mb-1 block">Week {topic.week}</span>
                                 <h5 className="text-sm font-bold text-slate-900 dark:text-white">{topic.title}</h5>
                               </div>
                               <div className="flex items-center gap-2">
                                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                   topic.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 
                                   topic.status === 'in-progress' ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' : 
                                   'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                                 }`}>
                                   {topic.status.replace('-', ' ')}
                                 </span>
                                 <div className="relative">
                                   <button 
                                     onClick={() => setActiveSyllabusDropdownId(activeSyllabusDropdownId === topic.id ? null : topic.id)}
                                     className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-neutral-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                   >
                                     <DotsThreeVertical size={14} weight="bold" />
                                   </button>
                                   <AnimatePresence>
                                     {activeSyllabusDropdownId === topic.id && (
                                       <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -5 }} className="absolute right-0 top-9 w-32 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden z-20">
                                         <button 
                                           onClick={() => handleEditSyllabus(topic)} 
                                           className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 text-slate-700 dark:text-neutral-300"
                                         >
                                           <PencilSimple size={12} /> Edit
                                         </button>
                                         <button 
                                           onClick={() => handleDeleteSyllabus(topic.id)} 
                                           className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                                         >
                                           <Trash size={12} /> Delete
                                         </button>
                                       </motion.div>
                                     )}
                                   </AnimatePresence>
                                 </div>
                               </div>
                             </div>
                             <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed">{topic.description}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Plus({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" className={className}>
      <path fill="currentColor" d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
    </svg>
  )
}
