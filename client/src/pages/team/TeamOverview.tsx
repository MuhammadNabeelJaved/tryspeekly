import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartBar, Users, BookOpen, Chalkboard, CreditCard, Handshake,
  Money, Certificate, Gift, Chats, ChatCircleDots, EnvelopeSimple,
  Star, Bell, PencilSimple, Globe, CheckCircle, XCircle,
  UserCircle, Lock, ClockCounterClockwise, ArrowRight,
  Hourglass, SealCheck, Sparkle,
} from '@phosphor-icons/react'
import { useAuth } from '@/context/AuthContext'
import { axiosClient } from '@/lib/axiosClient'
import { teamService } from '@/services/team.service'
import type { TeamNotification } from '@/services/team.service'

// ─── Permission metadata ──────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  {
    group: 'Core',
    items: [
      { key: 'overview',      label: 'Overview',      Icon: ChartBar,       path: '' },
      { key: 'students',      label: 'Students',      Icon: Users,          path: 'students' },
      { key: 'courses',       label: 'Courses',       Icon: BookOpen,       path: 'courses' },
      { key: 'instructors',   label: 'Instructors',   Icon: Chalkboard,     path: 'instructors' },
    ],
  },
  {
    group: 'Finance',
    items: [
      { key: 'payments',      label: 'Payments',      Icon: CreditCard,     path: 'payments' },
      { key: 'financial-aid', label: 'Financial Aid', Icon: Handshake,      path: 'financial-aid' },
      { key: 'salaries',      label: 'Salaries',      Icon: Money,          path: 'salaries' },
      { key: 'certificates',  label: 'Certificates',  Icon: Certificate,    path: 'certificates' },
      { key: 'referrals',     label: 'Referrals',     Icon: Gift,           path: 'referrals' },
    ],
  },
  {
    group: 'Communication',
    items: [
      { key: 'messages',      label: 'Messages',      Icon: Chats,          path: 'messages' },
      { key: 'support',       label: 'Support',       Icon: ChatCircleDots, path: 'support' },
      { key: 'contacts',      label: 'Contacts',      Icon: EnvelopeSimple, path: 'contacts' },
      { key: 'email',         label: 'Email System',  Icon: EnvelopeSimple, path: 'email' },
      { key: 'reviews',       label: 'Reviews',       Icon: Star,           path: 'reviews' },
      { key: 'notifications', label: 'Notifications', Icon: Bell,           path: 'notifications' },
    ],
  },
  {
    group: 'Content',
    items: [
      { key: 'blog',          label: 'Blog Manager',  Icon: PencilSimple,   path: 'blog' },
      { key: 'seo',           label: 'SEO Manager',   Icon: Globe,          path: 'seo' },
      { key: 'cms',           label: 'CMS Editor',    Icon: PencilSimple,   path: 'cms' },
      { key: 'geo-access',    label: 'Geo Access',    Icon: Globe,          path: 'geo-access' },
    ],
  },
]

const ALL_ITEMS = ALL_PERMISSIONS.flatMap(g => g.items)

// ─── Live stat definitions ────────────────────────────────────────────────────

interface LiveStat {
  label: string
  value: number | null
  color: string
  permission: string
  endpoint: string
  paramKey?: string
  paramVal?: string
}

const LIVE_STAT_DEFS: LiveStat[] = [
  { label: 'Total Students',     permission: 'students',      endpoint: '/users',           paramKey: 'role',   paramVal: 'student',  value: null, color: 'text-blue-600 dark:text-blue-400' },
  { label: 'Total Courses',      permission: 'courses',       endpoint: '/courses/admin/all',                                         value: null, color: 'text-violet-600 dark:text-violet-400' },
  { label: 'Pending Payments',   permission: 'payments',      endpoint: '/payments',        paramKey: 'status', paramVal: 'pending',  value: null, color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Open Tickets',       permission: 'support',       endpoint: '/support',         paramKey: 'status', paramVal: 'open',     value: null, color: 'text-red-500 dark:text-red-400' },
  { label: 'Aid Applications',   permission: 'financial-aid', endpoint: '/financial-aid',                                             value: null, color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Total Contacts',     permission: 'contacts',      endpoint: '/contacts',                                                  value: null, color: 'text-sky-600 dark:text-sky-400' },
]

// ─── Greeting helpers ─────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const LABEL_MAP: Record<string, string> = {
  students: 'Students', courses: 'Courses', instructors: 'Instructors',
  payments: 'Payments', 'financial-aid': 'Financial Aid', salaries: 'Salaries',
  certificates: 'Certificates', referrals: 'Referrals', messages: 'Messages',
  support: 'Support', contacts: 'Contacts', email: 'Email System',
  reviews: 'Reviews', notifications: 'Notifications', blog: 'Blog Manager',
  seo: 'SEO Manager', cms: 'CMS Editor', 'geo-access': 'Geo Access',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeamOverview() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const permissions: string[] = user?.permissions ?? []
  const grantedCount = permissions.length
  const totalCount   = ALL_ITEMS.length

  const [history, setHistory]     = useState<TeamNotification[]>([])
  const [liveStats, setLiveStats] = useState<LiveStat[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  // Load access history
  useEffect(() => {
    teamService.getNotifications()
      .then(res => setHistory(res.data))
      .catch(() => {})
  }, [])

  // Load live stats for granted permissions
  useEffect(() => {
    const relevant = LIVE_STAT_DEFS.filter(s => permissions.includes(s.permission))
    if (relevant.length === 0) return

    setStatsLoading(true)
    Promise.allSettled(
      relevant.map(async (stat) => {
        const params: Record<string, string> = { limit: '1', page: '1' }
        if (stat.paramKey && stat.paramVal) params[stat.paramKey] = stat.paramVal
        const res = await axiosClient.get(stat.endpoint, { params })
        const total: number =
          res.data?.pagination?.total ??
          res.data?.data?.length ??
          0
        return { ...stat, value: total }
      })
    ).then(results => {
      const filled = results.map((r, i) =>
        r.status === 'fulfilled' ? r.value : { ...relevant[i], value: null }
      )
      setLiveStats(filled)
    }).finally(() => setStatsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.join(',')])

  const grantedItems = ALL_ITEMS.filter(i => permissions.includes(i.key))

  return (
    <div className="space-y-6">

      {/* ── Greeting header ── */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-500 rounded-2xl p-5 flex items-center justify-between overflow-hidden relative">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative">
          <p className="text-violet-200 text-xs font-semibold mb-0.5">{getFormattedDate()}</p>
          <h2 className="text-white text-xl font-black">
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-violet-200 text-xs mt-1">
            {grantedCount === 0
              ? 'Your admin will assign pages to you soon.'
              : `You have access to ${grantedCount} page${grantedCount > 1 ? 's' : ''}.`}
          </p>
        </div>
        <Sparkle size={48} weight="fill" className="text-white opacity-20 flex-shrink-0" />
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.profileImage
              ? <img src={user.profileImage} alt={user.name} className="w-16 h-16 object-cover" />
              : <UserCircle size={36} weight="fill" className="text-violet-600 dark:text-violet-400" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{user?.name}</h3>
            <p className="text-sm text-slate-500 dark:text-neutral-400 truncate">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-lg">
                {(user as { jobTitle?: string })?.jobTitle || 'Team Member'}
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <SealCheck size={10} weight="fill" />Active
              </span>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{grantedCount}</p>
            <p className="text-xs text-slate-400 dark:text-neutral-600">of {totalCount} pages</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">Access level</p>
            <p className="text-xs font-bold text-slate-700 dark:text-neutral-300">
              {totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0}%
            </p>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-700"
              style={{ width: `${totalCount > 0 ? (grantedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Empty state (no permissions) ── */}
      {grantedCount === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Hourglass size={28} weight="fill" className="text-amber-500" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            Waiting for page access
          </h3>
          <p className="text-sm text-slate-400 dark:text-neutral-500 max-w-xs mx-auto">
            Your admin hasn't assigned any pages yet. You can still manage your profile and chat with admin.
          </p>
        </div>
      )}

      {/* ── Live stats ── */}
      {liveStats.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">
            Platform Stats
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {liveStats.map(stat => (
              <div
                key={stat.permission}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4"
              >
                {statsLoading || stat.value === null ? (
                  <div className="h-8 w-12 bg-slate-100 dark:bg-neutral-800 rounded-lg animate-pulse mb-1" />
                ) : (
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value.toLocaleString()}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-neutral-500 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick access shortcuts ── */}
      {grantedItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">
            Quick Access
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {grantedItems.map(({ key, label, Icon, path }) => (
              <button
                key={key}
                onClick={() => navigate(`/team${path ? `/${path}` : ''}`)}
                className="group flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-md transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-600 transition-colors">
                  <Icon size={17} weight="fill" className="text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-neutral-200 truncate">{label}</p>
                </div>
                <ArrowRight size={13} className="text-slate-300 dark:text-neutral-600 group-hover:text-violet-500 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Access history timeline ── */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClockCounterClockwise size={16} weight="fill" className="text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Access History</h3>
          </div>
          <div className="space-y-0">
            {history.map((n, idx) => (
              <div key={n._id} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    n.added.length > 0 && n.removed.length === 0 ? 'bg-emerald-500' :
                    n.removed.length > 0 && n.added.length === 0 ? 'bg-red-400' : 'bg-violet-500'
                  }`} />
                  {idx < history.length - 1 && (
                    <div className="w-px flex-1 bg-slate-100 dark:bg-neutral-800 mt-1 min-h-[16px]" />
                  )}
                </div>
                <div className="pb-3 min-w-0 flex-1">
                  {n.added.length > 0 && (
                    <p className="text-xs text-slate-700 dark:text-neutral-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Granted: </span>
                      {n.added.map(k => LABEL_MAP[k] ?? k).join(', ')}
                    </p>
                  )}
                  {n.removed.length > 0 && (
                    <p className="text-xs text-slate-700 dark:text-neutral-300 mt-0.5">
                      <span className="text-red-500 font-semibold">Removed: </span>
                      {n.removed.map(k => LABEL_MAP[k] ?? k).join(', ')}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-0.5">
                    {new Date(n.createdAt).toLocaleString([], {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Permissions grid ── */}
      <div className="space-y-5">
        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest">
          All Page Access
        </p>
        {ALL_PERMISSIONS.map(group => (
          <div key={group.group}>
            <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">
              {group.group}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {group.items.map(({ key, label, Icon }) => {
                const granted = permissions.includes(key)
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                      granted
                        ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800'
                        : 'bg-slate-50 dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 opacity-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      granted
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-200 dark:bg-neutral-700 text-slate-400 dark:text-neutral-600'
                    }`}>
                      {granted ? <Icon size={16} weight="fill" /> : <Lock size={14} weight="fill" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-semibold truncate ${
                        granted ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-neutral-600'
                      }`}>
                        {label}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {granted ? (
                          <>
                            <CheckCircle size={11} weight="fill" className="text-emerald-500 flex-shrink-0" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Granted</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} weight="fill" className="text-slate-300 dark:text-neutral-700 flex-shrink-0" />
                            <span className="text-[10px] text-slate-400 dark:text-neutral-600">No access</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
