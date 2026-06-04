import React, { useState, Suspense, lazy, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  House, BookOpen, Users, GearSix, VideoCamera,
  List, X, SignOut, Bell, Sun, Moon, Headset, Chats, CheckCircle, Sparkle, Money, Star
} from '@phosphor-icons/react'
import Loader from '@/components/Loader'
import TourGuide, { type TourStep } from '@/components/TourGuide'
import DashboardSearch, { type SearchItem } from '@/components/DashboardSearch'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import UserAvatar from '@/components/UserAvatar'
import { useAuth } from '@/context/AuthContext'
import { usersService } from '@/services/users.service'
import { useSocket } from '@/context/SocketContext'
import { notificationsService } from '@/services/notifications.service'
import type { Notification } from '@/types/api'
import { getNotificationPath } from '@/utils/notificationNav'

const InstructorOverview = lazy(() => import('./instructor/InstructorOverview'))
const InstructorCourses = lazy(() => import('./instructor/InstructorCourses'))
const InstructorLiveClasses = lazy(() => import('./instructor/InstructorLiveClasses'))
const InstructorStudents = lazy(() => import('./instructor/InstructorStudents'))
const InstructorMessages = lazy(() => import('./instructor/InstructorMessages'))
const InstructorSettings = lazy(() => import('./instructor/InstructorSettings'))
const InstructorSupport = lazy(() => import('./instructor/InstructorSupport'))
const InstructorNotifications = lazy(() => import('./instructor/InstructorNotifications'))
const InstructorAssignments = lazy(() => import('./instructor/InstructorAssignments'))
const InstructorSalary  = lazy(() => import('./instructor/InstructorSalary'))
const InstructorReviews = lazy(() => import('./instructor/InstructorReviews'))

export type InstructorView = 'overview' | 'courses' | 'live' | 'students' | 'messages' | 'assignments' | 'salary' | 'settings' | 'support' | 'notifications' | 'reviews'

// ─── SEARCH ITEMS ─────────────────────────────────────────────────────────────

const INSTRUCTOR_SEARCH_ITEMS: SearchItem[] = [
  { label: 'Dashboard',     description: 'Your stats, active courses, and recent activity',     path: '/instructor',                Icon: House as SearchItem['Icon'] },
  { label: 'My Courses',    description: 'Create and manage your courses',                       path: '/instructor/courses',        Icon: BookOpen as SearchItem['Icon'] },
  { label: 'Live Classes',  description: 'Schedule and manage live teaching sessions',           path: '/instructor/live',           Icon: VideoCamera as SearchItem['Icon'] },
  { label: 'My Students',   description: 'View enrolled students and track progress',            path: '/instructor/students',       Icon: Users as SearchItem['Icon'] },
  { label: 'Assignments',   description: 'Create assignments and review submissions',            path: '/instructor/assignments',    Icon: CheckCircle as SearchItem['Icon'] },
  { label: 'My Salary',     description: 'View salary history and submit requests',             path: '/instructor/salary',         Icon: Money as SearchItem['Icon'] },
  { label: 'Messages',      description: 'Chat with your students in real-time',                path: '/instructor/messages',       Icon: Chats as SearchItem['Icon'] },
  { label: 'Notifications', description: 'Enrollments, messages, and platform updates',         path: '/instructor/notifications',  Icon: Bell as SearchItem['Icon'] },
  { label: 'Settings',      description: 'Update your profile and teaching preferences',        path: '/instructor/settings',       Icon: GearSix as SearchItem['Icon'] },
  { label: 'Support & Help',description: 'Submit a support ticket to the admin team',           path: '/instructor/support',        Icon: Headset as SearchItem['Icon'] },
  { label: 'My Reviews',    description: 'View all your submitted reviews with approval status',  path: '/instructor/reviews',        Icon: Star as SearchItem['Icon'] },
]

const INSTRUCTOR_TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome, Instructor!',
    content: "Let's take a quick tour of your instructor dashboard so you can start teaching effectively. Click Next to continue.",
  },
  {
    target: 'instructor-nav-overview',
    title: 'Dashboard Overview',
    content: 'Your home screen shows key stats: total students, active courses, upcoming sessions, and recent activity.',
  },
  {
    target: 'instructor-nav-courses',
    title: 'My Courses',
    content: 'Create and manage your courses here. Upload videos or images, set schedules, and publish courses for students to enroll.',
  },
  {
    target: 'instructor-nav-live',
    title: 'Live Classes',
    content: 'Schedule and manage your live teaching sessions. Students are notified automatically when you add a new session.',
  },
  {
    target: 'instructor-nav-students',
    title: 'My Students',
    content: 'View all students enrolled in your courses, track their attendance, and monitor their progress.',
  },
  {
    target: 'instructor-nav-assignments',
    title: 'Assignments',
    content: 'Create assignments for your students and review their submissions all in one place.',
  },
  {
    target: 'instructor-nav-salary',
    title: 'My Salary',
    content: 'View your salary history, track approved payments, and submit salary requests to the admin.',
  },
  {
    target: 'instructor-nav-messages',
    title: 'Messages',
    content: 'Communicate directly with your students. Answer questions and provide personalized guidance.',
  },
  {
    target: 'instructor-nav-notifications',
    title: 'Notifications',
    content: 'Get notified about new enrollments, student messages, and platform updates.',
  },
  {
    target: 'instructor-nav-settings',
    title: 'Settings',
    content: 'Update your profile, bio, and teaching preferences that are visible to students.',
  },
  {
    target: 'instructor-nav-support',
    title: 'Support & Help',
    content: 'Having an issue or question? Submit a support ticket and the admin team will assist you.',
  },
  {
    target: 'instructor-nav-reviews',
    title: 'My Reviews',
    content: 'See all reviews you have submitted about the platform. Track their approval status, view rejection reasons if any, and edit or delete your reviews.',
  },
  {
    target: 'instructor-take-tour',
    title: "You're ready to teach!",
    content: "That's the full tour. Click \"Take Tour\" here anytime to revisit these tips. Good luck with your students!",
  },
]

type NavItem = { view: InstructorView; label: string; path: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }

const NAV_MAIN: NavItem[] = [
  { view: 'overview', label: 'Dashboard', path: '', Icon: House as NavItem['Icon'] },
  { view: 'live', label: 'Live Classes', path: 'live', Icon: VideoCamera as NavItem['Icon'] },
  { view: 'courses', label: 'My Courses', path: 'courses', Icon: BookOpen as NavItem['Icon'] },
  { view: 'students', label: 'My Students', path: 'students', Icon: Users as NavItem['Icon'] },
  { view: 'assignments', label: 'Assignments', path: 'assignments', Icon: CheckCircle as NavItem['Icon'] },
  { view: 'messages', label: 'Messages', path: 'messages', Icon: Chats as NavItem['Icon'] },
  { view: 'salary', label: 'My Salary', path: 'salary', Icon: Money as NavItem['Icon'] },
]

const NAV_PREFS: NavItem[] = [
  { view: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell as NavItem['Icon'] },
  { view: 'reviews', label: 'My Reviews', path: 'reviews', Icon: Star as NavItem['Icon'] },
  { view: 'settings', label: 'Settings', path: 'settings', Icon: GearSix as NavItem['Icon'] },
  { view: 'support', label: 'Support & Help', path: 'support', Icon: Headset as NavItem['Icon'] },
]

export default function InstructorDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setUser } = useAuth()
  const { unreadNotifications, setUnreadNotifications, unreadMessages } = useSocket()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const restartTourRef = useRef<(() => void) | null>(null)
  const tourSeen = !!user?.isOnboardingDone

  // Notification State
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    notificationsService.getMyNotifications({ limit: 5 })
      .then(res => { if (res.success) setNotifs(res.data) })
      .catch(() => {})
  }, [unreadNotifications])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead()
    setUnreadNotifications(0)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      notificationsService.markAsRead(notif._id).catch(() => {})
      setUnreadNotifications(prev => Math.max(0, prev - 1))
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
    }
    const { path, state } = getNotificationPath(notif, 'instructor')
    setShowNotifications(false)
    navigate(path, { state })
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
    const badge = view === 'messages' && unreadMessages > 0 ? unreadMessages : view === 'notifications' && unreadNotifications > 0 ? unreadNotifications : 0

    return (
      <button
        data-tour={`instructor-nav-${view}`}
        onClick={() => { navigate(`/instructor${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
          active
            ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        {label}
        {badge > 0 && (
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? 'bg-white/30 text-white' : 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'}`}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
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
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">TrySpeekly</p>
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
                <p className="text-[10px] text-slate-400 dark:text-neutral-400 mt-0.5 truncate">{user?.email || 'teacher@tryspeekly.com'}</p>
              </div>
            </div>
            <button
              data-tour="instructor-take-tour"
              onClick={() => { restartTourRef.current?.() }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all mb-1"
            >
              <span className="relative inline-flex items-center justify-center">
                {!tourSeen && (
                  <span className="absolute -inset-1.5 rounded-full animate-ping bg-violet-400 opacity-60 pointer-events-none" />
                )}
                <Sparkle size={18} weight="fill" />
              </span>
              Take Tour
            </button>
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

      <TourGuide
        steps={INSTRUCTOR_TOUR_STEPS}
        tourKey={`instructor_${user?.email || 'guest'}`}
        autoStart={!user?.isOnboardingDone}
        onRestartRef={(fn) => { restartTourRef.current = fn }}
        onFinish={async () => {
          try { const updated = await usersService.markOnboardingDone(); setUser(updated) } catch { /* ignore */ }
        }}
      />

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
            <DashboardSearch items={INSTRUCTOR_SEARCH_ITEMS} />
            <LanguageSwitcher compact />

            {/* Dark mode */}
            <button
              onClick={toggleDark}
              className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Messages icon */}
            <button
              onClick={() => navigate('/instructor/messages')}
              className="relative w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <Chats size={15} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${showNotifications ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400' : 'bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400'}`}
              >
                <Bell size={15} weight={showNotifications ? 'fill' : 'regular'} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
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
                      {unreadNotifications > 0 && (
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
                            <button key={notif._id} onClick={() => handleNotifClick(notif)} className={`w-full text-left p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer ${!notif.read ? 'bg-violet-50/30 dark:bg-violet-900/5' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                                {!notif.read ? <Bell size={14} weight="fill" /> : <CheckCircle size={14} />}
                              </div>
                              <div>
                                <p className={`text-sm ${!notif.read ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-neutral-300'}`}>{notif.title}: {notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                              </div>
                            </button>
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
                  <Route path="/assignments" element={<InstructorAssignments />} />
                  <Route path="/salary" element={<InstructorSalary />} />
                  <Route path="/messages" element={<InstructorMessages />} />
                  <Route path="/settings" element={<InstructorSettings />} />
                  <Route path="/support" element={<InstructorSupport />} />
                  <Route path="/notifications" element={<InstructorNotifications />} />
                  <Route path="/reviews" element={<InstructorReviews />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
