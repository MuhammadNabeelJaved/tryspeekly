import { useState, useEffect, useRef, Suspense, lazy, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  ChartBar, Users, BookOpen, Chalkboard, CreditCard, Handshake,
  Money, Certificate, Gift, Chats, ChatCircleDots, EnvelopeSimple,
  Star, Bell, PencilSimple, Globe, GearSix, SignOut, List, X, ChatTeardropText,
  SquaresFour, UserCircle, MagnifyingGlass, Sparkle, ChatText, Newspaper,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { teamService } from '@/services/team.service'
import type { TeamNotification } from '@/services/team.service'
import Loader from '@/components/Loader'
import UserAvatar from '@/components/UserAvatar'
import type { TeamChatMessage } from '@/types/api'
import type { Student, Instructor, Course, CMSPage } from './admin/adminData'
import {
  INITIAL_STUDENTS,
  INITIAL_INSTRUCTORS,
  INITIAL_COURSES,
  INITIAL_CMS_PAGES,
} from './admin/adminData'
import type { AdminStore } from './AdminPage'
import TeamOverview from './team/TeamOverview'
import TeamProfile from './team/TeamProfile'
import TeamReviews from './team/TeamReviews'
import TourGuide, { type TourStep } from '@/components/TourGuide'
import DashboardSearch, { type SearchItem } from '@/components/DashboardSearch'
import toast from 'react-hot-toast'

// TeamNotification is imported from team.service

// ─── Lazy-load the same admin page components ─────────────────────────────────
const AdminOverview      = lazy(() => import('./admin/AdminOverview'))
const AdminStudents      = lazy(() => import('./admin/AdminStudents'))
const AdminInstructors   = lazy(() => import('./admin/AdminInstructors'))
const AdminCourses       = lazy(() => import('./admin/AdminCourses'))
const AdminCertificates  = lazy(() => import('./admin/AdminCertificates'))
const AdminPaymentsView  = lazy(() => import('./admin/AdminPaymentsView'))
const AdminFinancialAid  = lazy(() => import('./admin/AdminFinancialAid'))
const AdminCMS           = lazy(() => import('./admin/AdminCMS'))
const AdminBlog          = lazy(() => import('./admin/AdminBlog'))
const AdminSupport       = lazy(() => import('./admin/AdminSupport'))
const AdminNotifications = lazy(() => import('./admin/AdminNotifications'))
const AdminMessages      = lazy(() => import('./admin/AdminMessages'))
const AdminSEO           = lazy(() => import('./admin/AdminSEO'))
const AdminReviews       = lazy(() => import('./admin/AdminReviews'))
const AdminGeoAccess     = lazy(() => import('./admin/AdminGeoAccess'))
const AdminSalaries      = lazy(() => import('./admin/AdminSalaries'))
const AdminContacts      = lazy(() => import('./admin/AdminContacts'))
const AdminReferrals     = lazy(() => import('./admin/AdminReferrals'))
const AdminEmail         = lazy(() => import('./admin/AdminEmail'))
const AdminNewsletter    = lazy(() => import('./admin/AdminNewsletter'))

// ─── Permission → nav item mapping ───────────────────────────────────────────

// These nav items are always visible — no permission required
const DASHBOARD_NAV = { key: '__dashboard__', label: 'Dashboard',    path: '',         Icon: SquaresFour }
const PROFILE_NAV   = { key: '__profile__',   label: 'My Profile',   path: 'profile',  Icon: UserCircle }
const REVIEWS_NAV   = { key: '__reviews__',   label: 'Team Reviews', path: 'reviews',  Icon: ChatText }

const ALL_NAV = [
  { key: 'students',      label: 'Students',      path: 'students',      Icon: Users },
  { key: 'courses',       label: 'Courses',       path: 'courses',       Icon: BookOpen },
  { key: 'instructors',   label: 'Instructors',   path: 'instructors',   Icon: Chalkboard },
  { key: 'payments',      label: 'Payments',      path: 'payments',      Icon: CreditCard },
  { key: 'financial-aid', label: 'Financial Aid', path: 'financial-aid', Icon: Handshake },
  { key: 'salaries',      label: 'Salaries',      path: 'salaries',      Icon: Money },
  { key: 'certificates',  label: 'Certificates',  path: 'certificates',  Icon: Certificate },
  { key: 'referrals',     label: 'Referrals',     path: 'referrals',     Icon: Gift },
  { key: 'messages',      label: 'Messages',      path: 'messages',      Icon: Chats },
  { key: 'support',       label: 'Support',       path: 'support',       Icon: ChatCircleDots },
  { key: 'contacts',      label: 'Contacts',      path: 'contacts',      Icon: EnvelopeSimple },
  { key: 'email',         label: 'Email System',  path: 'email',         Icon: EnvelopeSimple },
  { key: 'newsletter',   label: 'Newsletter',    path: 'newsletter',    Icon: Newspaper },
  { key: 'reviews',       label: 'Reviews',       path: 'reviews',       Icon: Star },
  { key: 'notifications', label: 'Notifications', path: 'notifications', Icon: Bell },
  { key: 'blog',          label: 'Blog Manager',  path: 'blog',          Icon: PencilSimple },
  { key: 'seo',           label: 'SEO Manager',   path: 'seo',           Icon: Globe },
  { key: 'cms',           label: 'CMS Editor',    path: 'cms',           Icon: PencilSimple },
  { key: 'geo-access',    label: 'Geo Access',    path: 'geo-access',    Icon: Globe },
]

// ─── Floating chat bubble ─────────────────────────────────────────────────────

function TeamChatBubble() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<TeamChatMessage[]>([])
  const [input, setInput] = useState('')
  const [unread, setUnread] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    teamService.getMemberThread()
      .then(res => setMessages(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!socket) return
    const handler = (msg: TeamChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev
        return [...prev, msg]
      })
      if (!open && msg.from._id !== user?._id) {
        setUnread(u => u + 1)
      }
    }
    socket.on('team:message:received', handler)
    return () => { socket.off('team:message:received', handler) }
  }, [socket, open, user])

  useEffect(() => {
    if (open) {
      setUnread(0)
      teamService.markMemberThreadRead().catch(() => {})
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages.length])

  const handleSend = () => {
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    teamService.sendMemberMessage(text)
      .catch(() => toast.error('Failed to send message.'))
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-80 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '420px' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800 bg-violet-600">
              <div className="flex items-center gap-2">
                <ChatTeardropText size={16} className="text-white" />
                <span className="text-sm font-bold text-white">Chat with Admin</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-violet-200 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-slate-400 dark:text-neutral-600 py-8">No messages yet.</p>
              )}
              {messages.map(msg => {
                const isMe = msg.from._id === user?._id
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      isMe
                        ? 'bg-violet-600 text-white rounded-br-sm'
                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white rounded-bl-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            <div className="flex gap-2 px-3 py-3 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Message admin..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        data-tour="team-chat-bubble"
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg flex items-center justify-center transition-colors"
      >
        <ChatTeardropText size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  )
}

// ─── Main TeamPage shell ──────────────────────────────────────────────────────

export default function TeamPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, setUser } = useAuth()
  const { socket } = useSocket()

  const permissions: string[] = user?.permissions ?? []
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifs, setNotifs] = useState<TeamNotification[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifsRef = useRef<HTMLDivElement>(null)
  const unreadNotifCount = notifs.filter(n => !n.read).length

  // Load persisted notifications from DB on mount
  useEffect(() => {
    teamService.getNotifications()
      .then(res => setNotifs(res.data))
      .catch(() => {})
  }, [])

  // Sidebar nav = Dashboard (always) + permitted pages + Profile (always)
  const permNavItems = ALL_NAV.filter(n => permissions.includes(n.key))
  const allNavItems  = [DASHBOARD_NAV, ...permNavItems, REVIEWS_NAV, PROFILE_NAV]

  const currentPath = location.pathname.replace('/team', '').replace(/^\//, '')
  const activeKey   = allNavItems.find(n => n.path === currentPath)?.key ?? '__dashboard__'
  const activeLabel = allNavItems.find(n => n.key === activeKey)?.label ?? 'Dashboard'

  // ─── Tour ─────────────────────────────────────────────────────────────────────
  const restartTourRef = useRef<(() => void) | null>(null)

  const PAGE_DESCRIPTIONS: Record<string, string> = {
    students:      'View and manage all registered students, their enrollments, and account status.',
    courses:       'Review, approve, and manage courses on the platform.',
    instructors:   'Manage instructor profiles, courses, and contact information.',
    payments:      'Review and process student payment submissions.',
    'financial-aid': 'Review and manage student financial aid applications.',
    salaries:      'Manage instructor salary packages, requests, and payouts.',
    certificates:  'Issue and manage student completion certificates.',
    referrals:     'Manage referral coupon codes, rewards, and payout requests.',
    messages:      'Handle direct messages between platform users.',
    support:       'View and respond to support tickets from students and instructors.',
    contacts:      'View messages submitted via the public contact form.',
    email:         'Manage email templates, triggers, delivery logs, and test emails.',
    newsletter:    'Manage newsletter subscribers and send broadcast email campaigns.',
    reviews:       'Moderate course reviews submitted by students.',
    notifications: 'View and manage platform-wide notifications.',
    blog:          'Create, edit, and publish blog posts for the platform.',
    seo:           'Manage SEO meta tags, titles, and keywords for the site.',
    cms:           'Edit public-facing static content pages without touching code.',
    'geo-access':  'Control which countries can access the platform.',
  }

  const tourSteps = useMemo<TourStep[]>(() => {
    const steps: TourStep[] = [
      {
        title: 'Welcome to Your Team Dashboard!',
        content: 'This tour walks you through everything available to you. Click Next or use arrow keys to navigate.',
      },
      {
        target: 'team-nav-__dashboard__',
        title: 'Dashboard',
        content: 'Your personal overview — profile, access level, live platform stats, quick shortcuts to your pages, and a full history of every permission change.',
      },
    ]
    permNavItems.forEach(n => {
      steps.push({
        target: `team-nav-${n.key}`,
        title: n.label,
        content: PAGE_DESCRIPTIONS[n.key] ?? `Manage the ${n.label} section of the platform.`,
      })
    })
    steps.push(
      {
        target: 'team-nav-__reviews__',
        title: 'Team Reviews',
        content: 'Read work experience reviews from all team members — great for new joiners to know what to expect. Write your own review here; the admin approves it and can feature it on the public homepage.',
      },
      {
        target: 'team-nav-__profile__',
        title: 'My Profile',
        content: 'Update your name, phone, bio, location, and profile photo. Change your password here too.',
      },
      {
        target: 'team-header-bell',
        title: 'Access Notifications',
        content: 'This bell lights up whenever your admin grants or removes page access. All history is saved — it persists across page refreshes.',
      },
      {
        target: 'team-header-search',
        title: 'Quick Search',
        content: 'Press Ctrl+K or click here to instantly search and jump to any page in your dashboard.',
      },
      {
        target: 'team-chat-bubble',
        title: 'Chat with Admin',
        content: 'Have a question? Click this button to open a direct chat with your admin. You\'ll see a badge when there are unread messages.',
      },
      {
        target: 'team-take-tour',
        title: 'Restart Tour',
        content: 'Click "Take Tour" anytime to restart this walkthrough from the beginning.',
      },
      {
        title: 'All Set!',
        content: 'You know your way around. Your admin can grant you more pages at any time — you\'ll get a real-time notification when they do.',
      },
    )
    return steps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permNavItems.map(n => n.key).join(',')])

  // ─── Search items (permission-aware) ──────────────────────────────────────────
  const searchItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = [
      { label: 'Dashboard',    description: 'Your overview, access stats, quick shortcuts, and permission history', path: '/team',          Icon: SquaresFour as SearchItem['Icon'] },
      { label: 'Team Reviews', description: 'Read and write work experience reviews from team members',             path: '/team/reviews',  Icon: ChatText    as SearchItem['Icon'] },
      { label: 'My Profile',   description: 'Update personal info, profile photo, and change password',             path: '/team/profile',  Icon: UserCircle  as SearchItem['Icon'] },
    ]
    permNavItems.forEach(n => {
      items.push({
        label:       n.label,
        description: PAGE_DESCRIPTIONS[n.key] ?? `Manage ${n.label}`,
        path:        `/team/${n.path}`,
        Icon:        n.Icon as SearchItem['Icon'],
      })
    })
    return items
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permNavItems.map(n => n.key).join(',')])

  // ─── Socket: permission change notifications ────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handler = (data: {
      permissions: string[]
      added: string[]
      removed: string[]
      notifId: string
      createdAt: string
    }) => {
      // Update user context so sidebar/routes update instantly
      if (user) setUser({ ...user, permissions: data.permissions })

      // Prepend the DB-persisted notification into local state
      const newNotif: TeamNotification = {
        _id: data.notifId,
        recipient: user?._id ?? '',
        added: data.added,
        removed: data.removed,
        read: false,
        createdAt: data.createdAt,
      }
      setNotifs(prev => [newNotif, ...prev].slice(0, 30))

      // Toast summary
      const labelMap: Record<string, string> = {
        students: 'Students', courses: 'Courses', instructors: 'Instructors',
        payments: 'Payments', 'financial-aid': 'Financial Aid', salaries: 'Salaries',
        certificates: 'Certificates', referrals: 'Referrals', messages: 'Messages',
        support: 'Support', contacts: 'Contacts', email: 'Email System',
        reviews: 'Reviews', notifications: 'Notifications', blog: 'Blog Manager',
        seo: 'SEO Manager', cms: 'CMS Editor', 'geo-access': 'Geo Access',
      }
      const lines: string[] = []
      if (data.added.length > 0)
        lines.push(`✅ Granted: ${data.added.map(k => labelMap[k] ?? k).join(', ')}`)
      if (data.removed.length > 0)
        lines.push(`🔒 Removed: ${data.removed.map(k => labelMap[k] ?? k).join(', ')}`)
      toast(lines.join(' · '), { duration: 5000, icon: '🔔' })

      // If current page permission was removed, go back to dashboard
      if (data.removed.length > 0 && data.removed.includes(currentPath)) {
        navigate('/team')
      }
    }

    socket.on('team:permissions:updated', handler)
    return () => { socket.off('team:permissions:updated', handler) }
  }, [socket, user, setUser, currentPath, navigate])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Store (needed by AdminStudents, AdminInstructors, AdminCourses, AdminCMS)
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

  const store: AdminStore = {
    students, instructors, courses, cmsPages,
    setStudents, setInstructors, setCourses, setCmsPages,
  }

  function handleLogout() { logout(); navigate('/') }

  function markAllNotifsRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    teamService.markNotificationsRead().catch(() => {})
  }

  function clearAllNotifs() {
    setNotifs([])
    teamService.clearNotifications().catch(() => {})
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-neutral-950 overflow-hidden">

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

      {/* ── SIDEBAR ── */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 bg-gradient-to-b from-violet-50 to-white dark:from-violet-950/20 dark:to-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-5 h-[64px] border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 6l6-3 6 3-6 3-6-3z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M3 12l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M3 9l6 3 6-3" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white leading-none">EnglishPro</p>
            <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Team Dashboard</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {allNavItems.map(({ key, label, path, Icon }) => {
            const active = activeKey === key
            return (
              <button
                key={key}
                data-tour={`team-nav-${key}`}
                onClick={() => { navigate(`/team${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-150 mb-1 ${
                  active
                    ? 'bg-violet-600 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'
                    : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} weight={active ? 'fill' : 'regular'} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <UserAvatar src={user?.profileImage} name={user?.name ?? ''} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">Team Member</p>
            </div>
          </div>
          <button
            data-tour="team-take-tour"
            onClick={() => restartTourRef.current?.()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors mb-1"
          >
            <Sparkle size={16} weight="fill" />
            Take Tour
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-500 dark:text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <SignOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 h-[64px] bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 flex items-center px-4 sm:px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-white">
            <List size={22} />
          </button>
          <h1 className="text-base font-black text-slate-900 dark:text-white truncate">{activeLabel}</h1>

          <div className="ml-auto flex items-center gap-2">
            {/* Search button */}
            <div data-tour="team-header-search">
              <DashboardSearch items={searchItems} />
            </div>

            {/* Bell icon — permission notifications */}
            <div className="relative" ref={notifsRef}>
              <button
                data-tour="team-header-bell"
                onClick={() => { setShowNotifs(v => !v); if (!showNotifs) markAllNotifsRead() }}
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  showNotifs
                    ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400'
                    : 'bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400'
                }`}
              >
                <Bell size={15} weight={showNotifs ? 'fill' : 'regular'} />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-neutral-800">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Access Updates</h3>
                      {notifs.length > 0 && (
                        <button onClick={clearAllNotifs} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
                          Clear all
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-neutral-600">
                          <Bell size={24} className="mb-2" />
                          <p className="text-xs font-medium">No notifications yet</p>
                          <p className="text-[11px] mt-0.5">Access changes will appear here</p>
                        </div>
                      ) : (
                        notifs.map(n => (
                          <div key={n._id} className={`px-4 py-3 border-b border-slate-50 dark:border-neutral-800 last:border-0 ${!n.read ? 'bg-violet-50/40 dark:bg-violet-950/10' : ''}`}>
                            {n.added.length > 0 && (
                              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                                ✅ Granted: {n.added.join(', ')}
                              </p>
                            )}
                            {n.removed.length > 0 && (
                              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed mt-0.5">
                                🔒 Removed: {n.removed.join(', ')}
                              </p>
                            )}
                            <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-1">
                              {new Date(n.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-1 rounded-lg">
              Team Member
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<TeamOverview />} />
              <Route path="/profile" element={<TeamProfile />} />
              <Route path="/reviews" element={<TeamReviews />} />
              {permissions.includes('students')      && <Route path="/students"      element={<AdminStudents store={store} />} />}
              {permissions.includes('instructors')   && <Route path="/instructors"   element={<AdminInstructors store={store} />} />}
              {permissions.includes('courses')       && <Route path="/courses"       element={<AdminCourses store={store} />} />}
              {permissions.includes('certificates')  && <Route path="/certificates"  element={<AdminCertificates />} />}
              {permissions.includes('payments')      && <Route path="/payments"      element={<AdminPaymentsView />} />}
              {permissions.includes('financial-aid') && <Route path="/financial-aid" element={<AdminFinancialAid />} />}
              {permissions.includes('cms')           && <Route path="/cms/*"         element={<AdminCMS store={store} basePath="/team/cms" />} />}
              {permissions.includes('blog')          && <Route path="/blog"          element={<AdminBlog />} />}
              {permissions.includes('support')       && <Route path="/support"       element={<AdminSupport />} />}
              {permissions.includes('notifications') && <Route path="/notifications" element={<AdminNotifications />} />}
              {permissions.includes('messages')      && <Route path="/messages"      element={<AdminMessages />} />}
              {permissions.includes('seo')           && <Route path="/seo"           element={<AdminSEO />} />}
              {permissions.includes('reviews')       && <Route path="/reviews"       element={<AdminReviews />} />}
              {permissions.includes('geo-access')    && <Route path="/geo-access"    element={<AdminGeoAccess />} />}
              {permissions.includes('salaries')      && <Route path="/salaries"      element={<AdminSalaries />} />}
              {permissions.includes('contacts')      && <Route path="/contacts"      element={<AdminContacts />} />}
              {permissions.includes('referrals')     && <Route path="/referrals"     element={<AdminReferrals />} />}
              {permissions.includes('email')         && <Route path="/email"         element={<AdminEmail />} />}
              {permissions.includes('newsletter')    && <Route path="/newsletter"    element={<AdminNewsletter />} />}
              <Route path="*" element={<Navigate to="/team" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Floating chat bubble */}
      <TeamChatBubble />
      <TourGuide
        steps={tourSteps}
        tourKey="team-dashboard-tour"
        autoStart={false}
        onRestartRef={fn => { restartTourRef.current = fn }}
      />
    </div>
  )
}
