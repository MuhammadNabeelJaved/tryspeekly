import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, Wallet, PencilSimple,
  List, X, SignOut, Bell, MagnifyingGlass, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash,
} from '@phosphor-icons/react'
import type { Student, Instructor, Course, CMSPage } from './admin/adminData'
import { INITIAL_STUDENTS, INITIAL_INSTRUCTORS, INITIAL_COURSES, INITIAL_CMS_PAGES } from './admin/adminData'
import AdminOverview from './admin/AdminOverview'
import AdminStudents from './admin/AdminStudents'
import AdminInstructors from './admin/AdminInstructors'
import AdminCourses from './admin/AdminCourses'
import AdminPaymentsView from './admin/AdminPaymentsView'
import AdminPaymentsSetup from './admin/AdminPaymentsSetup'
import AdminCMS from './admin/AdminCMS'
import AdminSettings from './admin/AdminSettings'

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'payments' | 'payments-setup' | 'cms' | 'settings'

export interface AdminStore {
  students: Student[]
  instructors: Instructor[]
  courses: Course[]
  cmsPages: CMSPage[]
  setStudents: (s: Student[]) => void
  setInstructors: (i: Instructor[]) => void
  setCourses: (c: Course[]) => void
  setCmsPages: (p: CMSPage[]) => void
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = 'admin123'

const NAV_ITEMS: { view: AdminView; label: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }[] = [
  { view: 'overview', label: 'Overview', Icon: ChartBar as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'students', label: 'Students', Icon: Users as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'instructors', label: 'Instructors', Icon: Chalkboard as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'courses', label: 'Courses', Icon: BookOpen as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'payments', label: 'Payments', Icon: CreditCard as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'payments-setup', label: 'Pay. Setup', Icon: Wallet as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'cms', label: 'CMS Editor', Icon: PencilSimple as React.FC<{ size?: number; weight?: string; className?: string }> },
  { view: 'settings', label: 'Settings', Icon: GearSix as React.FC<{ size?: number; weight?: string; className?: string }> },
]

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onLogin()
    } else {
      setError(true)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-violet-200/40 dark:bg-violet-900/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <motion.div
          animate={shaking ? { x: [-8, 8, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-neutral-900 rounded-[28px] border border-slate-200 dark:border-neutral-800 p-8 shadow-2xl shadow-slate-200/60 dark:shadow-black/40"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-[0_8px_24px_rgba(124,58,237,0.4)] mb-4">
              <Lock size={26} weight="fill" className="text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Admin Portal</h1>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mt-1">EnglishPro Academy</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false) }}
                  placeholder="Enter admin password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none transition-all ${
                    error
                      ? 'border-red-400 dark:border-red-600 focus:border-red-500'
                      : 'border-slate-200 dark:border-neutral-700 focus:border-violet-500 dark:focus:border-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors"
                >
                  {show ? <EyeSlash size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">Incorrect password. Try again.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.35)] text-sm mt-2"
            >
              Sign In to Dashboard
            </button>
          </form>

          <p className="text-center text-xs text-slate-300 dark:text-neutral-700 mt-6">
            Hint: admin123
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

// ─── MAIN ADMIN COMPONENT ─────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_authed') === '1')
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const [notifications] = useState(3)

  const [students, setStudents] = useState<Student[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_students') || 'null') ?? INITIAL_STUDENTS }
    catch { return INITIAL_STUDENTS }
  })
  const [instructors, setInstructors] = useState<Instructor[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_instructors') || 'null') ?? INITIAL_INSTRUCTORS }
    catch { return INITIAL_INSTRUCTORS }
  })
  const [courses, setCourses] = useState<Course[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_courses') || 'null') ?? INITIAL_COURSES }
    catch { return INITIAL_COURSES }
  })
  const [cmsPages, setCmsPages] = useState<CMSPage[]>(() => {
    try { return JSON.parse(localStorage.getItem('admin_cms') || 'null') ?? INITIAL_CMS_PAGES }
    catch { return INITIAL_CMS_PAGES }
  })

  useEffect(() => { localStorage.setItem('admin_students', JSON.stringify(students)) }, [students])
  useEffect(() => { localStorage.setItem('admin_instructors', JSON.stringify(instructors)) }, [instructors])
  useEffect(() => { localStorage.setItem('admin_courses', JSON.stringify(courses)) }, [courses])
  useEffect(() => { localStorage.setItem('admin_cms', JSON.stringify(cmsPages)) }, [cmsPages])

  function handleLogin() {
    sessionStorage.setItem('admin_authed', '1')
    setAuthed(true)
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_authed')
    setAuthed(false)
  }

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDarkMode(d => !d)
  }

  if (!authed) return <LoginScreen onLogin={handleLogin} />

  const store: AdminStore = { students, instructors, courses, cmsPages, setStudents, setInstructors, setCourses, setCmsPages }

  const activeLabel = NAV_ITEMS.find(n => n.view === activeView)?.label ?? 'Dashboard'

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-neutral-950 overflow-hidden transition-colors duration-300">

      {/* ── SIDEBAR ── */}
      <>
        {/* Mobile overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <motion.aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 h-[64px] border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">EnglishPro</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Admin Dashboard</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map(({ view, label, Icon }) => {
              const active = activeView === view
              return (
                <button
                  key={view}
                  onClick={() => { setActiveView(view); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon size={18} weight={active ? 'fill' : 'regular'} />
                  {label}
                  {view === 'students' && (
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400'}`}>
                      {students.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Bottom: logout */}
          <div className="px-3 pb-4 border-t border-slate-100 dark:border-neutral-800 pt-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              <SignOut size={18} />
              Sign Out
            </button>
          </div>
        </motion.aside>
      </>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-[64px] bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white transition-colors">
            <List size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-white truncate">{activeLabel}</h1>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600 hidden sm:block">EnglishPro Admin · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search hint */}
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs text-slate-400 dark:text-neutral-500 hover:border-violet-300 dark:hover:border-violet-700 transition-colors w-48">
              <MagnifyingGlass size={13} />
              Quick search…
            </button>

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notifications */}
            <button className="relative w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <Bell size={15} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications}</span>
              )}
            </button>

            {/* Avatar */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-black shadow-[0_2px_8px_rgba(124,58,237,0.4)]">
              A
            </div>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              {activeView === 'overview'    && <AdminOverview store={store} onNavigate={setActiveView} />}
              {activeView === 'students'    && <AdminStudents store={store} />}
              {activeView === 'instructors' && <AdminInstructors store={store} />}
              {activeView === 'courses'     && <AdminCourses store={store} />}
              {activeView === 'payments'       && <AdminPaymentsView store={store} />}
              {activeView === 'payments-setup' && <AdminPaymentsSetup store={store} />}
              {activeView === 'cms'            && <AdminCMS store={store} />}
              {activeView === 'settings'    && <AdminSettings store={store} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
