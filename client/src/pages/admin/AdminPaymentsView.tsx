import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, WarningCircle, XCircle, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import type { AdminStore } from '../AdminPage'
import { axiosClient } from '../../lib/axiosClient'

export default function AdminPaymentsView({ store }: { store: AdminStore }) {
  const { students, setStudents } = store
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterMethod, setFilterMethod] = useState('All')

  // Try to fetch real payments; fallback to students from store
  const [apiPayments, setApiPayments] = useState<typeof students | null>(null)

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await axiosClient.get('/payments/all', { params: { limit: 200 } })
        const payments: any[] = res.data?.data ?? []
        const mapped: typeof students = payments.map((p: any, idx: number) => ({
          id: p._id ?? p.id ?? `api-p${idx}`,
          name: p.student?.name ?? 'Unknown',
          email: p.student?.email ?? '',
          phone: '',
          country: '',
          city: '',
          courseId: p.course?._id ?? '',
          courseName: p.course?.title ?? '',
          courseLevel: '',
          paymentMethod: p.method ?? '',
          paymentAmount: p.amount ?? 0,
          paymentCurrency: p.currency ?? 'PKR',
          paymentStatus: (p.status === 'approved' ? 'paid' : p.status === 'rejected' ? 'failed' : 'pending') as 'paid' | 'pending' | 'failed',
          enrolledAt: p.createdAt?.split('T')[0] ?? '',
          status: 'active' as const,
          notes: p.adminNote ?? '',
          avatar: (p.student?.name ?? '').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || '?',
        }))
        setApiPayments(mapped)
      } catch {
        // Fallback to store data
      }
    }
    fetchPayments()
  }, [])

  const displayPayments = apiPayments ?? students

  const allMethods = ['All', ...Array.from(new Set(displayPayments.map(s => s.paymentMethod))).sort()]

  const filtered = displayPayments.filter(s => {
    const q = search.toLowerCase()
    const mQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.paymentMethod.toLowerCase().includes(q)
    const mS = filterStatus === 'All' || s.paymentStatus === filterStatus
    const mM = filterMethod === 'All' || s.paymentMethod === filterMethod
    return mQ && mS && mM
  })

  const totalPKR = displayPayments.filter(s => s.paymentStatus === 'paid' && s.paymentCurrency === 'PKR').reduce((a, s) => a + s.paymentAmount, 0)
  const totalUSD = displayPayments.filter(s => s.paymentStatus === 'paid' && s.paymentCurrency !== 'PKR').reduce((a, s) => a + s.paymentAmount, 0)
  const paidCount = displayPayments.filter(s => s.paymentStatus === 'paid').length
  const pendingCount = displayPayments.filter(s => s.paymentStatus === 'pending').length
  const failedCount = displayPayments.filter(s => s.paymentStatus === 'failed').length

  function updateStatus(id: string, status: 'paid' | 'pending' | 'failed') {
    setStudents(students.map(s => s.id === id ? { ...s, paymentStatus: status } : s))
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Payments</h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Track and manage all payment records</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Revenue (PKR)', value: `₨${totalPKR.toLocaleString()}`, Icon: CreditCard, color: 'from-violet-500 to-purple-600', glow: 'rgba(124,58,237,0.35)' },
          { label: 'Revenue (USD/Intl)', value: `$${totalUSD}`, Icon: CreditCard, color: 'from-blue-500 to-blue-700', glow: 'rgba(59,130,246,0.35)' },
          { label: 'Paid', value: paidCount, Icon: CheckCircle, color: 'from-emerald-500 to-emerald-700', glow: 'rgba(16,185,129,0.35)' },
          { label: 'Pending / Failed', value: `${pendingCount} / ${failedCount}`, Icon: WarningCircle, color: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.35)' },
        ].map(({ label, value, Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4"
          >
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`} style={{ boxShadow: `0 4px 12px ${glow}` }}>
              <Icon size={16} weight="fill" className="text-white" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{value}</p>
            <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or method…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <FunnelSimple size={14} className="text-slate-400" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
              {['All', 'paid', 'pending', 'failed'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
            {allMethods.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Payment table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                {['Student', 'Course', 'Method', 'Amount', 'Currency', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No payments found</td></tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{s.avatar}</div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{s.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{s.courseName}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{s.paymentMethod}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{s.paymentAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-neutral-600">{s.paymentCurrency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      s.paymentStatus === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      : s.paymentStatus === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                      : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                    }`}>{s.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{s.enrolledAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {s.paymentStatus !== 'paid' && (
                        <button onClick={() => updateStatus(s.id, 'paid')} title="Mark paid" className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <CheckCircle size={13} weight="fill" />
                        </button>
                      )}
                      {s.paymentStatus !== 'pending' && (
                        <button onClick={() => updateStatus(s.id, 'pending')} title="Mark pending" className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 flex items-center justify-center transition-colors">
                          <WarningCircle size={13} weight="fill" />
                        </button>
                      )}
                      {s.paymentStatus !== 'failed' && (
                        <button onClick={() => updateStatus(s.id, 'failed')} title="Mark failed" className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
                          <XCircle size={13} weight="fill" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-slate-300 dark:text-neutral-700 mt-3 text-center">Hover a row to see payment status actions</p>
    </div>
  )
}
