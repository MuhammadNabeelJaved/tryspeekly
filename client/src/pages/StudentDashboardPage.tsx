import React, { useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  House, BookOpen, CreditCard, Handshake, GearSix, ChatCircleDots,
  List, X, SignOut, Bell, Sun, Moon, Certificate
} from '@phosphor-icons/react'
import Loader from '@/components/Loader'

const StudentOverview = lazy(() => import('./student/StudentOverview'))
const StudentCourses = lazy(() => import('./student/StudentCourses'))
const StudentCourseDetails = lazy(() => import('./student/StudentCourseDetails'))
const StudentCertificates = lazy(() => import('./student/StudentCertificates'))
const StudentPayments = lazy(() => import('./student/StudentPayments'))
const StudentFinancialAid = lazy(() => import('./student/StudentFinancialAid'))
const StudentSettings = lazy(() => import('./student/StudentSettings'))
const StudentSupport = lazy(() => import('./student/StudentSupport'))

import { MOCK_STUDENT } from './student/studentData'

export type StudentView = 'overview' | 'courses' | 'certificates' | 'payments' | 'financial-aid' | 'settings' | 'support'

type NavItem = { view: StudentView; label: string; path: string; Icon: React.FC<{ size?: number; weight?: string; className?: string }> }

const NAV_MAIN: NavItem[] = [
  { view: 'overview', label: 'Home', path: '', Icon: House as NavItem['Icon'] },
  { view: 'courses', label: 'My Courses', path: 'courses', Icon: BookOpen as NavItem['Icon'] },
  { view: 'certificates', label: 'Certificates', path: 'certificates', Icon: Certificate as NavItem['Icon'] },
  { view: 'payments', label: 'Payments', path: 'payments', Icon: CreditCard as NavItem['Icon'] },
  { view: 'financial-aid', label: 'Financial Aid', path: 'financial-aid', Icon: Handshake as NavItem['Icon'] },
]

const NAV_PREFS: NavItem[] = [
  { view: 'support', label: 'Support', path: 'support', Icon: ChatCircleDots as NavItem['Icon'] },
  { view: 'settings', label: 'Settings', path: 'settings', Icon: GearSix as NavItem['Icon'] },
]

export default function StudentDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const [notifications] = useState(1)

  // Determine active view from current URL path
  const currentPath = location.pathname.replace('/dashboard', '').replace(/^\//, '')
  const activeView = [...NAV_MAIN, ...NAV_PREFS].find(item => item.path === currentPath)?.view || 'overview'

  function toggleDark() {
    document.documentElement.classList.toggle('dark')
    setDarkMode(d => !d)
  }

  function handleLogout() {
    window.location.href = '/'
  }

  // Wrap the navigation function so child components can still "navigate" 
  // via string matching the old view states
  function handleNavigate(view: StudentView) {
    const item = [...NAV_MAIN, ...NAV_PREFS].find(n => n.view === view)
    if (item) {
      navigate(`/dashboard${item.path ? `/${item.path}` : ''}`)
    }
  }

  const renderNavItem = ({ view, label, path, Icon }: NavItem) => {
    const active = activeView === view

    return (
      <button
        onClick={() => { navigate(`/dashboard${path ? `/${path}` : ''}`); setSidebarOpen(false) }}
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
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">Student Portal</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200">
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-neutral-500 px-3 mb-1 mt-2">
              Learning
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
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-[0_4px_12px_rgba(124,58,237,0.4)]">
                {MOCK_STUDENT.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none truncate">{MOCK_STUDENT.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-400 mt-0.5 truncate">{MOCK_STUDENT.email}</p>
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
            <p className="text-[11px] text-slate-400 dark:text-neutral-500 hidden sm:block">Welcome back, {MOCK_STUDENT.name.split(' ')[0]} 👋</p>
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
            <button className="relative w-8 h-8 rounded-lg bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <Bell size={15} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{notifications}</span>
              )}
            </button>
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
                  <Route path="/" element={<StudentOverview onNavigate={handleNavigate} />} />
                  <Route path="/courses" element={<StudentCourses />} />
                  <Route path="/courses/:id" element={<StudentCourseDetails />} />
                  <Route path="/certificates" element={<StudentCertificates />} />
                  <Route path="/payments" element={<StudentPayments />} />
                  <Route path="/financial-aid" element={<StudentFinancialAid />} />
                  <Route path="/settings" element={<StudentSettings />} />
                  <Route path="/support" element={<StudentSupport />} />
                </Routes>
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
