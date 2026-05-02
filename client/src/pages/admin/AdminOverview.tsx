import { motion } from 'framer-motion'
import { Users, BookOpen, CreditCard, TrendUp, Globe, ChartPieSlice, ArrowRight, Student, Handshake } from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import type { AdminView } from '../AdminPage'

const FLAG_MAP: Record<string, string> = {
  'Pakistan': '🇵🇰',
  'India': '🇮🇳',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Bangladesh': '🇧🇩',
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-orange-600',
]

function getGreeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const card = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } }

export default function AdminOverview({ store, onNavigate }: { store: AdminStore; onNavigate: (v: AdminView) => void }) {
  const { students, instructors, courses, financialAidApps } = store
  const now = new Date()

  const totalRevenuePKR = students
    .filter(s => s.paymentStatus === 'paid' && s.paymentCurrency === 'PKR')
    .reduce((a, s) => a + s.paymentAmount, 0)

  const activeStudents = students.filter(s => s.status === 'active').length
  const pendingPayments = students.filter(s => s.paymentStatus === 'pending').length
  const failedPayments = students.filter(s => s.paymentStatus === 'failed').length

  // Country breakdown
  const countryMap: Record<string, number> = {}
  students.forEach(s => { countryMap[s.country] = (countryMap[s.country] || 0) + 1 })
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Payment method breakdown
  const payMap: Record<string, number> = {}
  students.forEach(s => { payMap[s.paymentMethod] = (payMap[s.paymentMethod] || 0) + 1 })
  const payMethods = Object.entries(payMap).sort((a, b) => b[1] - a[1])

  // Course enrollment
  const courseMap: Record<string, number> = {}
  students.forEach(s => { courseMap[s.courseName] = (courseMap[s.courseName] || 0) + 1 })
  const topCourses = Object.entries(courseMap).sort((a, b) => b[1] - a[1])

  const recentStudents = [...students].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 5)

  const statCards = [
    {
      label: 'Total Students',
      value: students.length,
      sub: `${activeStudents} active`,
      Icon: Users,
      variant: 'gradient' as const,
      color: 'from-violet-600 via-purple-600 to-indigo-700',
      glow: 'rgba(124,58,237,0.35)',
      borderColor: '',
      view: 'students' as AdminView,
    },
    {
      label: 'Total Courses',
      value: courses.filter(c => c.status === 'active').length,
      sub: `${courses.length} total`,
      Icon: BookOpen,
      variant: 'normal' as const,
      color: 'from-blue-500 to-blue-700',
      glow: 'rgba(59,130,246,0.35)',
      borderColor: 'border-l-blue-500',
      view: 'courses' as AdminView,
    },
    {
      label: 'Instructors',
      value: instructors.length,
      sub: `${instructors.filter(i => i.status === 'active').length} active`,
      Icon: Student,
      variant: 'normal' as const,
      color: 'from-emerald-500 to-emerald-700',
      glow: 'rgba(16,185,129,0.35)',
      borderColor: 'border-l-emerald-500',
      view: 'instructors' as AdminView,
    },
    {
      label: 'Revenue (PKR)',
      value: `₨${totalRevenuePKR.toLocaleString()}`,
      sub: `${students.filter(s => s.paymentStatus === 'paid').length} paid`,
      Icon: CreditCard,
      variant: 'dark' as const,
      color: 'from-amber-500 to-orange-600',
      glow: 'rgba(245,158,11,0.35)',
      borderColor: '',
      view: 'payments' as AdminView,
    },
    {
      label: 'Financial Aid',
      value: financialAidApps.length,
      sub: `${financialAidApps.filter(a => a.status === 'pending' || a.status === 'under_review').length} pending/review`,
      Icon: Handshake,
      variant: 'normal' as const,
      color: 'from-pink-500 to-rose-600',
      glow: 'rgba(244,63,94,0.35)',
      borderColor: 'border-l-pink-500',
      view: 'financial-aid' as AdminView,
    },
  ]

  return (
    <div className="relative p-4 sm:p-6 space-y-6 max-w-7xl mx-auto overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-200/30 dark:bg-violet-900/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Welcome strip */}
      <motion.div {...card} className="relative">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {getGreeting(now.getHours())}, Admin 👋
        </h2>
        <p className="text-sm text-slate-400 dark:text-neutral-500 mt-0.5">
          {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Alert strip */}
      {(pendingPayments > 0 || failedPayments > 0) && (
        <motion.div {...card} className="flex flex-wrap gap-3">
          {pendingPayments > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {pendingPayments} payment{pendingPayments > 1 ? 's' : ''} pending verification
            </div>
          )}
          {failedPayments > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {failedPayments} payment{failedPayments > 1 ? 's' : ''} failed
            </div>
          )}
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 relative">
        {statCards.map((s, i) => {
          if (s.variant === 'gradient') {
            return (
              <motion.button
                key={s.label}
                type="button"
                {...card}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onNavigate(s.view)}
                className={`group relative bg-gradient-to-br ${s.color} rounded-3xl p-4 sm:p-5 text-left overflow-hidden`}
              >
                <span className="absolute -top-2 -right-2 text-[80px] font-black text-white/10 leading-none select-none pointer-events-none" aria-hidden="true">
                  {typeof s.value === 'number' ? s.value : ''}
                </span>
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <s.Icon size={18} weight="fill" className="text-white" />
                  </div>
                  <ArrowRight size={14} className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white leading-none mb-1 relative z-10">{s.value}</p>
                <p className="text-xs text-white/70 font-medium relative z-10">{s.label}</p>
                <p className="text-[10px] text-white/50 mt-0.5 relative z-10">{s.sub}</p>
              </motion.button>
            )
          }

          if (s.variant === 'dark') {
            return (
              <motion.button
                key={s.label}
                type="button"
                {...card}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => onNavigate(s.view)}
                className="group relative bg-slate-900 dark:bg-neutral-800 rounded-3xl p-4 sm:p-5 text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start justify-between mb-3 relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`} style={{ boxShadow: `0 4px 12px ${s.glow}` }}>
                    <s.Icon size={18} weight="fill" className="text-white" />
                  </div>
                  <ArrowRight size={14} className="text-white/30 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xl sm:text-2xl font-black text-white leading-none mb-1 relative z-10">{s.value}</p>
                <p className="text-xs text-slate-400 font-medium relative z-10">{s.label}</p>
                <p className="text-[10px] text-slate-600 mt-0.5 relative z-10">{s.sub}</p>
              </motion.button>
            )
          }

          return (
            <motion.button
              key={s.label}
              type="button"
              {...card}
              transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate(s.view)}
              className={`group relative bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 border-l-4 ${s.borderColor} p-4 sm:p-5 text-left hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200 overflow-hidden`}
            >
              <div className="flex items-start justify-between mb-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`} style={{ boxShadow: `0 4px 12px ${s.glow}` }}>
                  <s.Icon size={18} weight="fill" className="text-white" />
                </div>
                <ArrowRight size={14} className="text-slate-300 dark:text-neutral-700 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none mb-1 relative z-10">{s.value}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 font-medium relative z-10">{s.label}</p>
              <p className="text-[10px] text-slate-300 dark:text-neutral-700 mt-0.5 relative z-10">{s.sub}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Second row */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent enrollments */}
        <motion.div {...card} transition={{ delay: 0.2 }} className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/50">
              <TrendUp size={13} weight="fill" className="text-violet-600 dark:text-violet-400" />
              <span className="text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase">Recent Enrollments</span>
            </div>
            <button type="button" onClick={() => onNavigate('students')} className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-neutral-800">
            {recentStudents.map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors">
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {s.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
                  <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{s.courseName} · {s.country}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' :
                    s.paymentStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' :
                    'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  }`}>
                    {s.paymentStatus}
                  </span>
                  <p className="text-[10px] text-slate-300 dark:text-neutral-700 mt-0.5">{s.enrolledAt}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Countries */}
        <motion.div {...card} transition={{ delay: 0.25 }} className="bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50">
              <Globe size={13} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide uppercase">Students by Country</span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {topCountries.map(([country, count]) => (
              <div key={country}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">
                    {FLAG_MAP[country] ? `${FLAG_MAP[country]} ` : ''}{country}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 flex-shrink-0 ml-2">{count}</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / (students.length || 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Third row */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Payment methods */}
        <motion.div {...card} transition={{ delay: 0.3 }} className="bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50">
              <ChartPieSlice size={13} weight="fill" className="text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase">Payment Methods</span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {payMethods.map(([method, count]) => (
              <div key={method} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300">{method}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">{count} ({Math.round((count / (students.length || 1)) * 100)}%)</span>
                  </div>
                  <div className="h-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / (students.length || 1)) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Course enrollment */}
        <motion.div {...card} transition={{ delay: 0.35 }} className="bg-white dark:bg-neutral-900 rounded-[20px] border border-slate-100 dark:border-neutral-800 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50">
              <BookOpen size={13} weight="fill" className="text-amber-600 dark:text-amber-400" />
              <span className="text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wide uppercase">Enrollment by Course</span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {topCourses.map(([course, count]) => (
              <div key={course}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-neutral-300 truncate">{course}</span>
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 flex-shrink-0 ml-2">{count}</span>
                </div>
                <div className="h-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / (students.length || 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
