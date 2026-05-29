import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import {
  ChartBar, Users, BookOpen, Chalkboard, CreditCard, Handshake,
  Money, Certificate, Gift, Chats, ChatCircleDots, EnvelopeSimple,
  Star, Bell, PencilSimple, Globe, GearSix, SignOut, List, X, ChatTeardropText,
} from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { teamService } from '@/services/team.service'
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
import toast from 'react-hot-toast'

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

// ─── Permission → nav item mapping ───────────────────────────────────────────

const ALL_NAV = [
  { key: 'overview',      label: 'Overview',     path: '',              Icon: ChartBar },
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
  const { user, logout } = useAuth()

  const permissions: string[] = user?.permissions ?? []
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = ALL_NAV.filter(n => permissions.includes(n.key))
  const currentPath = location.pathname.replace('/team', '').replace(/^\//, '')
  const activeKey = navItems.find(n => n.path === currentPath)?.key ?? navItems[0]?.key ?? ''
  const activeLabel = navItems.find(n => n.key === activeKey)?.label ?? 'Dashboard'

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

  function handleLogout() {
    logout()
    navigate('/')
  }

  if (permissions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4">
        <div className="text-center">
          <GearSix size={48} className="mx-auto mb-4 text-slate-300 dark:text-neutral-700" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Pages Assigned</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400 mb-6">
            You don&apos;t have access to any pages yet. Contact your admin.
          </p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
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
          {navItems.map(({ key, label, path, Icon }) => {
            const active = activeKey === key
            return (
              <button
                key={key}
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
          <div className="ml-auto">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-1 rounded-lg">
              Team Member
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route
                path="/"
                element={
                  permissions.includes('overview')
                    ? <AdminOverview onNavigate={(view: string) => {
                        const navItem = ALL_NAV.find(n => n.key === view)
                        if (navItem && permissions.includes(navItem.key)) {
                          navigate(`/team${navItem.path ? `/${navItem.path}` : ''}`)
                        }
                      }} />
                    : <Navigate to={`/team${navItems[0]?.path ? `/${navItems[0].path}` : ''}`} replace />
                }
              />
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
              <Route path="*" element={<Navigate to="/team" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Floating chat bubble */}
      <TeamChatBubble />
    </div>
  )
}
