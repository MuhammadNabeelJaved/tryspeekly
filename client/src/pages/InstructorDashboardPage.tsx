import React, { useState, Suspense, lazy, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  House, BookOpen, Users, GearSix, VideoCamera,
  List, X, SignOut, Bell, Sun, Moon, Headset, Chats, CheckCircle
} from '@phosphor-icons/react'
import Loader from '@/components/Loader'
import UserAvatar from '@/components/UserAvatar'
import { useAuth } from '@/context/AuthContext'

const InstructorOverview = lazy(() => import('./instructor/InstructorOverview'))
const InstructorCourses = lazy(() => import('./instructor/InstructorCourses'))
const InstructorLiveClasses = lazy(() => import('./instructor/InstructorLiveClasses'))
const InstructorStudents = lazy(() => import('./instructor/InstructorStudents'))
const InstructorMessages = lazy(() => import('./instructor/InstructorMessages'))
const InstructorSettings = lazy(() => import('./instructor/InstructorSettings'))
const InstructorSupport = lazy(() => import('./instructor/InstructorSupport'))
const InstructorNotifications = lazy(() => import('./instructor/InstructorNotifications'))

export type InstructorView = 'overview' | 'courses' | 'live' | 'students' | 'messages' | 'assignments' | 'settings' | 'support' | 'notifications'

type NavItem = { view: InstructorView; label: string; path: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }

const NAV_MAIN: NavItem[] = [
  { view: 'overview', label: 'Dashboard', path: '', Icon: House as NavItem['Icon'] },
  { view: 'courses', label: 'My Courses', path: 'courses', Icon: BookOpen as NavItem['Icon'] },
  { view: 'live', label: 'Live Classes', path: 'live', Icon: VideoCamera as NavItem['Icon'] },
  { view: 'students', label: 'My Students', path: 'students', Icon: Users as NavItem['Icon'] },
  { view: 'messages', label: 'Messages', path: 'messages', Icon: Chats as NavItem['Icon'] },
]

const NAV_PREFS: NavItem[] = [
  { view: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell as NavItem['Icon'] },
  { view: 'settings', label: 'Settings', path: 'settings', Icon: GearSix as NavItem['Icon'] },
  { view: 'support', label: 'Support & Help', path: 'support', Icon: Headset as NavItem['Icon'] },
]

export default function InstructorDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  
  // Notification State
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifs, setNotifs] = useState([
    { id: 1, text: 'New student enrolled in IELTS Prep', time: '5m ago', unread: true },
    { id: 2, text: 'New message from Ali Khan', time: '10m ago', unread: true },
    { id: 3, text: 'Live class starts in 30 mins', time: '25m ago', unread: false },
  ])
  const unreadCount = notifs.filter(n => n.unread).length
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllAsRead = () => {
    setNotifs(notifs.map(n => ({ ...n, unread: false })))
  }

  // Determine active view from current URL path
  const currentPath = location.pathname.replace('/instructor', '').replace(/^\//, '')
  const activeView = [...NAV_MAIN, ...NAV_PREFS].find(item => item.path === currentPath)?.view || 'overview'

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDarkMode(d => !d)
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  function handleNavigate(view: InstructorView) {
    const item = [...NAV_MAIN, ...NAV_PREFS].find(n => n.view === view)
    if (item) {
      navigate(`/instructor${item.path ? `/${item.path}` : ''}`)
    }
  }

  const renderNavItem = ({ view, label, path, Icon }: NavItem) => {
    const active = activeView === view

    return (
      <button
        onClick={() => { navigate(`/instructor${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
          active
            ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        {label}
      </button>
    )
  }

  const allNavItems = [...NAV_MAIN, ...NAV_PREFS]
  const activeLabel = allNavItems.find(n => n.view === activeView)?.label ?? 'Dashboard'

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
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
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
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Instructor Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 px-3 mb-1 mt-2">
              Teaching
            </p>
            <div className="space-y-0.5 mb-6">
              {NAV_MAIN.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 px-3 mb-1">
              Account
            </p>
            <div className="space-y-0.5">
              {NAV_PREFS.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
            </div>
          </nav>

          {/* Bottom: profile card + logout */}
          <div className="px-3 pb-4 border-t border-slate-100 dark:border-neutral-800 pt-3">
            {/* Profile card */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-2xl px-3 py-2.5 mb-3">
              <UserAvatar src={user?.profileImage} name={user?.name} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none truncate">{user?.name || 'Instructor'}</p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-400 mt-0.5 truncate">{user?.email || 'teacher@englishpro.com'}</p>
              </div>
            </div>
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
        <header className="h-[64px] bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-neutral-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white transition-colors">
            <List size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 dark:text-white truncate">{activeLabel}</h1>
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:block">Good morning, {user?.name?.split(' ')[0] || 'Instructor'}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${showNotifications ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400' : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400'}`}
              >
                <Bell size={15} weight={showNotifications ? "fill" : "regular"} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 dark:text-neutral-400 text-sm">No notifications</div>
                      ) : (
                        <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
                          {notifs.map(notif => (
                            <div key={notif.id} className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors ${notif.unread ? 'bg-violet-50/30 dark:bg-violet-900/5' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                                {notif.unread ? <Bell size={14} weight="fill" /> : <CheckCircle size={14} />}
                              </div>
                              <div>
                                <p className={`text-sm ${notif.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-neutral-300'}`}>{notif.text}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50">
                      <button 
                        onClick={() => { navigate('/instructor/notifications'); setShowNotifications(false); }}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="max-w-6xl mx-auto h-full"
            >
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<InstructorOverview onNavigate={handleNavigate} />} />
                  <Route path="/courses" element={<InstructorCourses />} />
                  <Route path="/live" element={<InstructorLiveClasses />} />
                  <Route path="/students" element={<InstructorStudents />} />
                  <Route path="/messages" element={<InstructorMessages />} />
                  <Route path="/settings" element={<InstructorSettings />} />
                  <Route path="/support" element={<InstructorSupport />} />
                  <Route path="/notifications" element={<InstructorNotifications />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
