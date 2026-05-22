import React, { useState, useEffect, Suspense, lazy, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBar, Users, Chalkboard, BookOpen, CreditCard, PencilSimple,
  List, X, SignOut, Bell, MagnifyingGlass, Sun, Moon, GearSix,
  Lock, Eye, EyeSlash, Handshake, Certificate, ChatCircleDots, CheckCircle, Chats, Globe, Star, Sparkle, Money, EnvelopeSimple
} from '@phosphor-icons/react'
import TourGuide, { type TourStep } from '@/components/TourGuide'
import type { Student, Instructor, Course, CMSPage } from './admin/adminData'
import { INITIAL_STUDENTS, INITIAL_INSTRUCTORS, INITIAL_COURSES, INITIAL_CMS_PAGES } from './admin/adminData'
import Loader from '@/components/Loader'
import UserAvatar from '@/components/UserAvatar'
import { useAuth } from '../context/AuthContext'
import { usersService } from '../services/users.service'
import { useSocket } from '../context/SocketContext'
import { notificationsService } from '../services/notifications.service'
import { reviewsService } from '../services/reviews.service'
import { axiosClient } from '../lib/axiosClient'
import type { Notification } from '../types/api'
import { getNotificationPath } from '../utils/notificationNav'

const AdminOverview = lazy(() => import('./admin/AdminOverview'))
const AdminStudents = lazy(() => import('./admin/AdminStudents'))
const AdminInstructors = lazy(() => import('./admin/AdminInstructors'))
const AdminCourses = lazy(() => import('./admin/AdminCourses'))
const AdminCertificates = lazy(() => import('./admin/AdminCertificates'))
const AdminPaymentsView = lazy(() => import('./admin/AdminPaymentsView'))
const AdminFinancialAid = lazy(() => import('./admin/AdminFinancialAid'))
const AdminCMS = lazy(() => import('./admin/AdminCMS'))
const AdminBlog = lazy(() => import('./admin/AdminBlog'))
const AdminSettings = lazy(() => import('./admin/AdminSettings'))
const AdminSupport = lazy(() => import('./admin/AdminSupport'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminMessages = lazy(() => import('./admin/AdminMessages'))
const AdminSEO = lazy(() => import('./admin/AdminSEO'))
const AdminReviews = lazy(() => import('./admin/AdminReviews'))
const AdminGeoAccess = lazy(() => import('./admin/AdminGeoAccess'))
const AdminSalaries = lazy(() => import('./admin/AdminSalaries'))
const AdminContacts = lazy(() => import('./admin/AdminContacts'))

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'salaries' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews' | 'geo-access' | 'contacts'

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

type NavItem = { view: AdminView; label: string; path: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }

const NAV_CORE: NavItem[] = [
  { view: 'overview',    label: 'Overview',    path: '',            Icon: ChartBar as NavItem['Icon'] },
  { view: 'students',    label: 'Students',    path: 'students',    Icon: Users as NavItem['Icon'] },
  { view: 'courses',     label: 'Courses',     path: 'courses',     Icon: BookOpen as NavItem['Icon'] },
  { view: 'instructors', label: 'Instructors', path: 'instructors', Icon: Chalkboard as NavItem['Icon'] },
]

const NAV_FINANCE: NavItem[] = [
  { view: 'payments',      label: 'Payments',      path: 'payments',      Icon: CreditCard as NavItem['Icon'] },
  { view: 'financial-aid', label: 'Financial Aid', path: 'financial-aid', Icon: Handshake as NavItem['Icon'] },
  { view: 'salaries', label: 'Salaries', path: 'salaries', Icon: Money as NavItem['Icon'] },
  { view: 'certificates',  label: 'Certificates',  path: 'certificates',  Icon: Certificate as NavItem['Icon'] },
]

const NAV_COMMUNICATION: NavItem[] = [
  { view: 'messages',      label: 'Messages',      path: 'messages',      Icon: Chats as NavItem['Icon'] },
  { view: 'support',       label: 'Support',       path: 'support',       Icon: ChatCircleDots as NavItem['Icon'] },
  { view: 'contacts',      label: 'Contacts',      path: 'contacts',      Icon: EnvelopeSimple as NavItem['Icon'] },
  { view: 'reviews',       label: 'Reviews',       path: 'reviews',       Icon: Star as NavItem['Icon'] },
  { view: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell as NavItem['Icon'] },
]

const NAV_CONTENT: NavItem[] = [
  { view: 'blog',       label: 'Blog Manager',  path: 'blog',       Icon: PencilSimple as NavItem['Icon'] },
  { view: 'seo',        label: 'SEO Manager',   path: 'seo',        Icon: Globe as NavItem['Icon'] },
  { view: 'cms',        label: 'CMS Editor',    path: 'cms',        Icon: PencilSimple as NavItem['Icon'] },
  { view: 'geo-access', label: 'Geo Access',    path: 'geo-access', Icon: Globe as NavItem['Icon'] },
  { view: 'settings',   label: 'Settings',      path: 'settings',   Icon: GearSix as NavItem['Icon'] },
]

// ─── TOUR STEPS ───────────────────────────────────────────────────────────────

const ADMIN_TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Admin Dashboard!',
    content: "This tour walks you through everything you can manage here. Click Next to explore each section.",
  },
  {
    target: 'admin-nav-overview',
    title: 'Overview',
    content: 'Your command center — see platform-wide stats: total students, revenue, active courses, and pending tasks at a glance.',
  },
  {
    target: 'admin-nav-students',
    title: 'Students',
    content: 'View and manage all registered students, check their enrolled courses, payment totals, and account status.',
  },
  {
    target: 'admin-nav-courses',
    title: 'Courses',
    content: 'Review, approve, or reject courses submitted by instructors. Manage published and draft courses.',
  },
  {
    target: 'admin-nav-instructors',
    title: 'Instructors',
    content: 'Manage all instructors on the platform. View their courses count, profile details, and contact info.',
  },
  {
    target: 'admin-nav-payments',
    title: 'Payments',
    content: 'Review payment submissions from students. Approve or reject payment proofs and track revenue.',
  },
  {
    target: 'admin-nav-financial-aid',
    title: 'Financial Aid',
    content: 'Review financial aid applications from students. Accept or reject and trigger free enrollments.',
  },
  {
    target: 'admin-nav-certificates',
    title: 'Certificates',
    content: 'Issue certificates to students who have completed their courses.',
  },
  {
    target: 'admin-nav-messages',
    title: 'Messages',
    content: 'Handle direct messages between students, instructors, and the admin team.',
  },
  {
    target: 'admin-nav-support',
    title: 'Support',
    content: 'View and respond to support tickets submitted by students and instructors.',
  },
  {
    target: 'admin-nav-reviews',
    title: 'Reviews',
    content: 'Moderate course reviews submitted by students before they go public.',
  },
  {
    target: 'admin-nav-blog',
    title: 'Blog Manager',
    content: 'Create and publish blog posts to keep your students and visitors engaged.',
  },
  {
    target: 'admin-nav-seo',
    title: 'SEO Manager',
    content: 'Manage meta titles, descriptions, and keywords to improve your site\'s search engine visibility.',
  },
  {
    target: 'admin-nav-settings',
    title: 'Settings',
    content: 'Configure platform-wide settings, site info, and admin preferences.',
  },
  {
    target: 'admin-take-tour',
    title: "Tour complete!",
    content: 'You now know your way around the admin dashboard. Click "Take Tour" anytime to restart this walkthrough.',
  },
]

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string }>({
    defaultValues: { password: '' }
  })
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  function onSubmit(data: { password: string }) {
    if (data.password === ADMIN_PASSWORD) {
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  placeholder="Enter admin password"
                  {...register('password', { 
                    required: 'Password is required',
                    onChange: () => setError(false)
                  })}
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none transition-all ${
                    error || errors.password
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
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message as string}</p>}
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
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout, setUser } = useAuth()
  const isAdmin = isAuthenticated && user?.role === 'admin'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    // Dev mode: auto-authenticate
    if (import.meta.env.DEV) return true
    return localStorage.getItem('admin_auth') === 'true'
  })
  const notifRef = useRef(null);
  const restartTourRef = useRef<(() => void) | null>(null)
  const tourSeen = !!user?.isOnboardingDone
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const { unreadNotifications, setUnreadNotifications, unreadMessages } = useSocket()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [adminBadges, setAdminBadges] = useState({ students: 0, pendingPayments: 0, pendingCourses: 0, pendingFinancialAid: 0, pendingReviews: 0 })

  useEffect(() => {
    notificationsService.getMyNotifications({ limit: 5 })
      .then(res => { if (res.success) setNotifs(res.data) })
      .catch(() => {})
  }, [unreadNotifications])

  useEffect(() => {
    const fetchBadges = async () => {
      let pendingReviews = 0
      try {
        const reviewsRes = await reviewsService.getAdminReviews({ status: 'pending', limit: 1 })
        if (reviewsRes.success) {
          pendingReviews = reviewsRes.pagination?.total ?? 0
        }
      } catch { /* ignore */ }

      axiosClient.get('/stats/admin')
        .then(res => {
          const d = res.data?.data
          if (d) setAdminBadges({
            students: d.totalStudents ?? 0,
            pendingPayments: (d.pendingPayments ?? 0) + (d.failedPayments ?? 0),
            pendingCourses: d.pendingCourseReviews ?? 0,
            pendingFinancialAid: d.pendingFinancialAid ?? 0,
            pendingReviews,
          })
        })
        .catch(() => {})
    }
    fetchBadges()
  }, [])

  async function markAllAsRead() {
    await notificationsService.markAllAsRead()
    setUnreadNotifications(0)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function handleNotifClick(notif: Notification) {
    if (!notif.read) {
      notificationsService.markAsRead(notif._id).catch(() => {})
      setUnreadNotifications(prev => Math.max(0, prev - 1))
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
    }
    const { path, state } = getNotificationPath(notif, 'admin')
    setShowNotifications(false)
    navigate(path, { state })
  }


  const currentPath = location.pathname.replace('/admin', '').replace(/^\//, '')
  const allNavItems = [...NAV_CORE, ...NAV_FINANCE, ...NAV_COMMUNICATION, ...NAV_CONTENT]
  const activeView = allNavItems.find(item => item.path === currentPath)?.view || 'overview'

  function handleNavigate(view: AdminView) {
    const item = allNavItems.find(n => n.view === view)
    if (item) {
      navigate(`/admin${item.path ? `/${item.path}` : ''}`)
    }
  }

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

  // Force admin auth in dev mode
  useEffect(() => {
    if (import.meta.env.DEV) {
      setIsAdminAuthenticated(true)
      localStorage.setItem('admin_auth', 'true')
    }
  }, [])

  function handleLogin() {
    setIsAdminAuthenticated(true)
    localStorage.setItem('admin_auth', 'true')
  }

  function handleLogout() {
    setIsAdminAuthenticated(false)
    localStorage.removeItem('admin_auth')
    logout()
    navigate('/')
  }

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDarkMode(d => !d)
  }

  if (!isAdmin && !import.meta.env.DEV) {
    // Redirect to login if not authenticated at all, or redirect to their own dashboard
    if (!isAdminAuthenticated) return <LoginScreen onLogin={handleLogin} />
    return <Navigate to="/" replace />
  }

  // In dev mode, bypass auth check but still show login screen for visual
  if (import.meta.env.DEV && !isAdminAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const renderNavItem = ({ view, label, path, Icon }: NavItem) => {
    const active = activeView === view
    const badge =
      view === 'messages' && unreadMessages > 0 ? unreadMessages :
      view === 'notifications' && unreadNotifications > 0 ? unreadNotifications :
      view === 'students' && adminBadges.students > 0 ? adminBadges.students :
      view === 'payments' && adminBadges.pendingPayments > 0 ? adminBadges.pendingPayments :
      view === 'courses' && adminBadges.pendingCourses > 0 ? adminBadges.pendingCourses :
      view === 'financial-aid' && adminBadges.pendingFinancialAid > 0 ? adminBadges.pendingFinancialAid :
      view === 'reviews' && adminBadges.pendingReviews > 0 ? adminBadges.pendingReviews :
      null

    return (
      <button
        data-tour={`admin-nav-${view}`}
        onClick={() => { navigate(`/admin${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 ${
          active
            ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Icon size={18} weight={active ? 'fill' : 'regular'} />
        {label}
        {badge !== null && (
          <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${
            active ? 'bg-white/20 text-white' :
            view === 'students' ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400' :
            'bg-amber-400 text-white'
          }`}>
            {typeof badge === 'number' && badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>
    )
  }

  const store: AdminStore = { students, instructors, courses, cmsPages, setStudents, setInstructors, setCourses, setCmsPages }

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
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
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
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">Core</p>
              <div className="space-y-0.5">
                {NAV_CORE.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">Finance</p>
              <div className="space-y-0.5">
                {NAV_FINANCE.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">Communication</p>
              <div className="space-y-0.5">
                {NAV_COMMUNICATION.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-600 px-3 mb-1">Content & System</p>
              <div className="space-y-0.5">
                {NAV_CONTENT.map(item => <React.Fragment key={item.view}>{renderNavItem(item)}</React.Fragment>)}
              </div>
            </div>
          </nav>

          {/* Bottom: profile card + logout */}
          <div className="px-3 pb-4 border-t border-slate-100 dark:border-neutral-800 pt-3">
            {/* Profile card */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-2xl px-3 py-2.5 mb-3">
              <UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">Admin</p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-0.5 truncate">admin@englishpro.com</p>
              </div>
            </div>
            <button
              data-tour="admin-take-tour"
              onClick={() => { restartTourRef.current?.(); setTourSeen(true) }}
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
        steps={ADMIN_TOUR_STEPS}
        tourKey={`admin_${user?.email || 'guest'}`}
        autoStart={!user?.isOnboardingDone}
        onRestartRef={(fn) => { restartTourRef.current = fn }}
        onFinish={async () => {
          try { const updated = await usersService.markOnboardingDone(); setUser(updated) } catch { /* ignore */ }
        }}
      />

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

            {/* Messages icon */}
            <button
              onClick={() => navigate('/admin/messages')}
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
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${showNotifications ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400'}`}
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
                        onClick={() => { navigate('/admin/notifications'); setShowNotifications(false); }}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                      >
                        View All
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <UserAvatar src={user?.profileImage} name={user?.name || 'Admin'} size="sm" />
          </div>
        </header>

        {/* View content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full"
            >
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<AdminOverview onNavigate={handleNavigate} />} />
                  <Route path="/students" element={<AdminStudents store={store} />} />
                  <Route path="/instructors" element={<AdminInstructors store={store} />} />
                  <Route path="/courses" element={<AdminCourses store={store} />} />
                  <Route path="/certificates" element={<AdminCertificates />} />
                  <Route path="/payments" element={<AdminPaymentsView />} />
                  <Route path="/financial-aid" element={<AdminFinancialAid />} />
                  <Route path="/cms/*" element={<AdminCMS store={store} />} />
                  <Route path="/blog" element={<AdminBlog />} />
                   <Route path="/settings" element={<AdminSettings store={store} />} />
                  <Route path="/support" element={<AdminSupport />} />
                  <Route path="/notifications" element={<AdminNotifications />} />
                  <Route path="/messages" element={<AdminMessages />} />
                  <Route path="/seo" element={<AdminSEO />} />
                  <Route path="/reviews" element={<AdminReviews />} />
                  <Route path="/geo-access" element={<AdminGeoAccess />} />
                  <Route path="/salaries" element={<AdminSalaries />} />
                  <Route path="/contacts" element={<AdminContacts />} />
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
