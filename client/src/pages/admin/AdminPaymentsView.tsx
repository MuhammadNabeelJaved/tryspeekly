import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle, WarningCircle, XCircle, MagnifyingGlass, FunnelSimple, Plus, Image, LockSimple, WhatsappLogo } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { Payment, UnpaidEnrollment, PaymentMethod } from '@/types/api'
import AdminPaymentCreateModal from './AdminPaymentCreateModal'
import toast from 'react-hot-toast'

type ActionState = { paymentId: string; type: 'approve' | 'reject'; note: string } | null

type DirectApproveState = {
  enrollmentId: string
  studentName: string
  courseName: string
  method: PaymentMethod
  amount: string
  transactionId: string
  adminNote: string
} | null

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'easypaisa', label: 'EasyPaisa' },
  { value: 'nayapay', label: 'NayaPay' },
  { value: 'sadapay', label: 'SadaPay' },
  { value: 'zindigi', label: 'Zindigi' },
  { value: 'bank_local', label: 'Bank (Local)' },
  { value: 'bank_international', label: 'Bank (Intl)' },
]

export default function AdminPaymentsView() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [unpaidEnrollments, setUnpaidEnrollments] = useState<UnpaidEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [unpaidLoading, setUnpaidLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'payments' | 'unpaid'>('unpaid')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterMethod, setFilterMethod] = useState('All')
  const [action, setAction] = useState<ActionState>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [directApprove, setDirectApprove] = useState<DirectApproveState>(null)
  const [directApproveLoading, setDirectApproveLoading] = useState(false)
  const [directApproveError, setDirectApproveError] = useState('')

  const fetchPayments = useCallback(() => {
    setLoading(true)
    paymentsService.getAllPayments({ limit: 200 })
      .then(res => setPayments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchUnpaid = useCallback(() => {
    setUnpaidLoading(true)
    paymentsService.getUnpaidEnrollments()
      .then(res => setUnpaidEnrollments(res.data))
      .catch(() => {})
      .finally(() => setUnpaidLoading(false))
  }, [])

  useEffect(() => { fetchPayments(); fetchUnpaid() }, [fetchPayments, fetchUnpaid])

  const handleDirectApproveConfirm = async () => {
    if (!directApprove) return
    if (!directApprove.amount || Number(directApprove.amount) <= 0) {
      setDirectApproveError('Amount is required.')
      return
    }
    setDirectApproveLoading(true)
    setDirectApproveError('')
    try {
      await paymentsService.directApprovePayment({
        enrollmentId: directApprove.enrollmentId,
        method: directApprove.method,
        transactionId: directApprove.transactionId || undefined,
        amount: Number(directApprove.amount),
        currency: 'PKR',
        adminNote: directApprove.adminNote || undefined,
      })
      toast.success(`Payment approved — ${directApprove.studentName} now has course access.`)
      setDirectApprove(null)
      fetchUnpaid()
      fetchPayments()
    } catch (err: any) {
      setDirectApproveError(err?.response?.data?.error?.message || 'Failed. Please try again.')
    } finally {
      setDirectApproveLoading(false)
    }
  }

  const allMethods = ['All', ...Array.from(new Set(payments.map(p => p.method))).sort()]

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    const mQ = !q || p.student.name.toLowerCase().includes(q) || p.student.email.toLowerCase().includes(q) || p.method.toLowerCase().includes(q)
    const mS = filterStatus === 'All' || p.status === filterStatus
    const mM = filterMethod === 'All' || p.method === filterMethod
    return mQ && mS && mM
  })

  const totalPKR = payments.filter(p => p.status === 'approved' && p.currency === 'PKR').reduce((a, p) => a + p.amount, 0)
  const totalUSD = payments.filter(p => p.status === 'approved' && p.currency === 'USD').reduce((a, p) => a + p.amount, 0)
  const paidCount = payments.filter(p => p.status === 'approved').length
  const pendingCount = payments.filter(p => p.status === 'pending').length
  const failedCount = payments.filter(p => p.status === 'rejected').length

  const handleActionConfirm = async () => {
    if (!action) return
    if (action.type === 'reject' && !action.note.trim()) {
      setActionError('Rejection reason is required.')
      return
    }
    setActionLoading(true)
    setActionError('')
    try {
      if (action.type === 'approve') {
        await paymentsService.approvePayment(action.paymentId, action.note || undefined)
      } else {
        await paymentsService.rejectPayment(action.paymentId, action.note)
      }
      setAction(null)
      fetchPayments()
    } catch (err: any) {
      setActionError(err?.response?.data?.error?.message || 'Action failed. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Payments</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Track and manage all payment records</p>
        </div>
        <button onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors">
          <Plus size={16} weight="bold" />
          Add Payment
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-neutral-800 rounded-2xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'unpaid' ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}
        >
          <WhatsappLogo size={15} weight="fill" />
          No Payment Yet
          {unpaidEnrollments.length > 0 && (
            <span className="bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unpaidEnrollments.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}
        >
          <CreditCard size={15} />
          Payment Records
          {payments.filter(p => p.status === 'pending').length > 0 && (
            <span className="bg-amber-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{payments.filter(p => p.status === 'pending').length}</span>
          )}
        </button>
      </div>

      {/* Summary cards */}
      {/* ── No Payment Yet tab ── */}
      {activeTab === 'unpaid' && (
        <div>
          {/* Direct approve panel */}
          {directApprove && (
            <div className="mb-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-3">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                ✓ Approve Payment — <span className="font-black">{directApprove.studentName}</span> · {directApprove.courseName}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Payment Method</label>
                  <select
                    value={directApprove.method}
                    onChange={e => setDirectApprove(d => d ? { ...d, method: e.target.value as PaymentMethod } : d)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                  >
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    value={directApprove.amount}
                    onChange={e => setDirectApprove(d => d ? { ...d, amount: e.target.value } : d)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Transaction ID (optional)</label>
                  <input
                    value={directApprove.transactionId}
                    onChange={e => setDirectApprove(d => d ? { ...d, transactionId: e.target.value } : d)}
                    placeholder="e.g. TXN123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Admin Note (optional)</label>
                  <input
                    value={directApprove.adminNote}
                    onChange={e => setDirectApprove(d => d ? { ...d, adminNote: e.target.value } : d)}
                    placeholder="e.g. Verified via WhatsApp"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                  />
                </div>
              </div>
              {directApproveError && <p className="text-xs text-red-500">{directApproveError}</p>}
              <div className="flex gap-2">
                <button onClick={handleDirectApproveConfirm} disabled={directApproveLoading}
                  className="px-4 py-2 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {directApproveLoading ? 'Approving…' : 'Confirm & Approve'}
                </button>
                <button onClick={() => { setDirectApprove(null); setDirectApproveError('') }}
                  className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                    {['Student', 'Course', 'Level', 'Course Price', 'Enrolled On', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                  {unpaidLoading && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">Loading…</td></tr>
                  )}
                  {!unpaidLoading && unpaidEnrollments.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">
                      All enrolled students have submitted payment records.
                    </td></tr>
                  )}
                  {unpaidEnrollments.map(e => {
                    const price = e.course.currency === 'USD' ? (e.course.priceUSD ?? 0) : (e.course.price ?? 0)
                    const priceSuffix = e.course.pricingType === 'monthly' ? '/mo' : e.course.pricingType === 'per_session' ? '/session' : ''
                    const priceLabel = price > 0 ? `${e.course.currency === 'USD' ? '$' : 'Rs.'}${price.toLocaleString()}${priceSuffix}` : 'Free'
                    const isApproving = directApprove?.enrollmentId === e._id
                    return (
                      <tr key={e._id} className={`hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors ${isApproving ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {(e.student.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-xs">{e.student.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{e.student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 max-w-[160px] truncate">{e.course.title}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-neutral-400 capitalize">{e.course.level ?? '—'}</td>
                        <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{priceLabel}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">
                          {new Date(e.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setDirectApprove({
                                enrollmentId: e._id,
                                studentName: e.student.name,
                                courseName: e.course.title,
                                method: 'jazzcash',
                                amount: price > 0 ? String(price) : '',
                                transactionId: '',
                                adminNote: '',
                              })
                              setDirectApproveError('')
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                          >
                            <CheckCircle size={12} weight="fill" /> Approve Payment
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Records tab ── */}
      {activeTab === 'payments' && <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Revenue (PKR)', value: `₨${totalPKR.toLocaleString()}`, Icon: CreditCard, color: 'from-violet-500 to-purple-600', glow: 'rgba(124,58,237,0.35)' },
          { label: 'Revenue (USD)', value: `$${totalUSD}`, Icon: CreditCard, color: 'from-blue-500 to-blue-700', glow: 'rgba(59,130,246,0.35)' },
          { label: 'Approved', value: paidCount, Icon: CheckCircle, color: 'from-emerald-500 to-emerald-700', glow: 'rgba(16,185,129,0.35)' },
          { label: 'Pending / Rejected', value: `${pendingCount} / ${failedCount}`, Icon: WarningCircle, color: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.35)' },
        ].map(({ label, value, Icon, color, glow }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-4">
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
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div className="flex gap-2 items-center">
          <FunnelSimple size={14} className="text-slate-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
            {['All', 'pending', 'approved', 'rejected'].map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500 transition-colors">
            {allMethods.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Action panel */}
      {action && (
        <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {action.type === 'approve' ? '✓ Approve Payment — will activate course access' : '✕ Reject Payment — will lock course access'}
          </p>
          <input
            value={action.note}
            onChange={e => setAction(a => a ? { ...a, note: e.target.value } : a)}
            placeholder={action.type === 'approve' ? 'Admin note (optional)' : 'Rejection reason (required)'}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
          />
          {actionError && <p className="text-xs text-red-500">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={handleActionConfirm} disabled={actionLoading}
              className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${action.type === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
              {actionLoading ? 'Processing…' : 'Confirm'}
            </button>
            <button onClick={() => { setAction(null); setActionError('') }}
              className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                {['Student', 'Course', 'Method', 'Amount', 'Status', 'Date', 'Screenshot', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No payments found</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(p.student.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{p.student.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{p.student.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{p.course.title}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">{p.currency} {p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                        : p.status === 'pending' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>{p.status}</span>
                      {p.enrollmentActive ? (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={10} weight="fill" /> Course Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
                          <LockSimple size={10} weight="fill" /> Access Locked
                        </div>
                      )}
                      {p.status === 'rejected' && p.rejectionReason && (
                        <p className="text-[10px] text-red-500 dark:text-red-400 max-w-[140px] truncate" title={p.rejectionReason}>
                          {p.rejectionReason}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {p.screenshotUrl ? (
                      <a href={p.screenshotUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-semibold">
                        <Image size={14} /> View
                      </a>
                    ) : (
                      <span className="text-slate-300 dark:text-neutral-700 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {p.status !== 'approved' && (
                        <button
                          onClick={() => setAction({ paymentId: p._id, type: 'approve', note: '' })}
                          title="Approve — activates course access"
                          className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                          <CheckCircle size={13} weight="fill" />
                        </button>
                      )}
                      {p.status !== 'rejected' && (
                        <button
                          onClick={() => setAction({ paymentId: p._id, type: 'reject', note: '' })}
                          title="Reject — locks course access"
                          className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
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
      </div>}

      <AdminPaymentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => { setCreateModalOpen(false); fetchPayments() }}
      />
    </div>
  )
}
