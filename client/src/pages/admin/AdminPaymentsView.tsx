import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, CheckCircle, WarningCircle, XCircle, MagnifyingGlass, FunnelSimple, Plus, Image, LockSimple, WhatsappLogo, Gift, Trash, Warning, CalendarBlank } from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import { monthlyFeeService } from '@/services/monthly-fee.service'
import type { Payment, UnpaidEnrollment, PaymentMethod, MonthlyFee } from '@/types/api'
import AdminPaymentCreateModal from './AdminPaymentCreateModal'
import toast from 'react-hot-toast'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MF_METHODS: Record<string,string> = { easypaisa:'Easypaisa', jazzcash:'JazzCash', nayapay:'NayaPay', sadapay:'SadaPay', zindigi:'Zindigi', bank_local:'Bank (Local)', bank_international:'Bank (Intl)' }

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
  const [activeTab, setActiveTab] = useState<'payments' | 'unpaid' | 'monthly-fees'>('unpaid')
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>([])
  const [mfLoading, setMfLoading] = useState(false)
  const [mfFilters, setMfFilters] = useState({ status: 'All', year: String(new Date().getFullYear()), month: 'All' })
  const [mfSearch, setMfSearch] = useState('')
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
  const [reprocessingReferral, setReprocessingReferral] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; studentName: string } | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deactivateEnrollment, setDeactivateEnrollment] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  const fetchMonthlyFees = useCallback(() => {
    setMfLoading(true)
    monthlyFeeService.getFees({ limit: 500 })
      .then(res => setMonthlyFees(res.data))
      .catch(() => {})
      .finally(() => setMfLoading(false))
  }, [])

  useEffect(() => { fetchPayments(); fetchUnpaid(); fetchMonthlyFees() }, [fetchPayments, fetchUnpaid, fetchMonthlyFees])
  useEffect(() => { if (activeTab === 'monthly-fees') fetchMonthlyFees() }, [activeTab, fetchMonthlyFees])

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

  const handleReprocessReferral = async (paymentId: string) => {
    setReprocessingReferral(paymentId)
    try {
      const res = await paymentsService.reprocessReferral(paymentId)
      if (res.data?.alreadyProcessed) {
        toast.success('Referral reward was already credited.')
      } else {
        toast.success(res.message || 'Referral reward credited successfully!')
        fetchPayments()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to process referral reward.')
    } finally {
      setReprocessingReferral(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await paymentsService.deletePayment(deleteTarget.id, deactivateEnrollment)
      setPayments(prev => prev.filter(p => p._id !== deleteTarget.id))
      setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
      toast.success('Payment deleted')
      setDeleteTarget(null)
      setDeactivateEnrollment(false)
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    setDeleteLoading(true)
    try {
      const ids = Array.from(selectedIds)
      const res = await paymentsService.bulkDeletePayments(ids, deactivateEnrollment)
      setPayments(prev => prev.filter(p => !selectedIds.has(p._id)))
      setSelectedIds(new Set())
      toast.success(res.message || `${res.data.deleted} payments deleted`)
      setBulkDeleteOpen(false)
      setDeactivateEnrollment(false)
    } catch {
      toast.error('Failed to delete payments')
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const allMethods = ['All', ...Array.from(new Set(payments.map(p => p.method))).sort()]

  const filtered = payments.filter(p => {
    if (p.amount === 0 && p.status === 'approved') return false
    const q = search.toLowerCase()
    const mQ = !q || (p.student?.name ?? '').toLowerCase().includes(q) || (p.student?.email ?? '').toLowerCase().includes(q) || p.method.toLowerCase().includes(q)
    const mS = filterStatus === 'All' || p.status === filterStatus
    const mM = filterMethod === 'All' || p.method === filterMethod
    return mQ && mS && mM
  })

  const allFilteredIds = filtered.map(p => p._id)
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))

  const filteredMfPaid = (filterStatus === 'All' || filterStatus === 'approved')
    ? monthlyFees.filter(f => {
        if (f.status !== 'paid') return false
        const q = search.toLowerCase()
        if (!q) return true
        const student = typeof f.student === 'object' ? f.student : null
        const course  = typeof f.course  === 'object' ? f.course  : null
        return (student?.name ?? '').toLowerCase().includes(q) ||
               (student?.email ?? '').toLowerCase().includes(q) ||
               (course?.title ?? '').toLowerCase().includes(q)
      })
    : []

  const mfPaidPKR = monthlyFees.filter(f => f.status === 'paid' && f.currency === 'PKR').reduce((a, f) => a + f.amount, 0)
  const mfPaidUSD = monthlyFees.filter(f => f.status === 'paid' && f.currency === 'USD').reduce((a, f) => a + f.amount, 0)
  const totalPKR = payments.filter(p => p.status === 'approved' && p.currency === 'PKR').reduce((a, p) => a + p.amount, 0) + mfPaidPKR
  const totalUSD = payments.filter(p => p.status === 'approved' && p.currency === 'USD').reduce((a, p) => a + p.amount, 0) + mfPaidUSD
  const paidCount = payments.filter(p => p.status === 'approved').length + monthlyFees.filter(f => f.status === 'paid').length
  const pendingCount = payments.filter(p => p.status === 'pending').length + monthlyFees.filter(f => f.status === 'pending').length
  const failedCount = payments.filter(p => p.status === 'rejected').length + monthlyFees.filter(f => f.status === 'overdue').length

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
        <button
          onClick={() => setActiveTab('monthly-fees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'monthly-fees' ? 'bg-white dark:bg-neutral-900 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'}`}
        >
          <CalendarBlank size={15} />
          Monthly Fees
          {monthlyFees.filter(f => f.status === 'overdue').length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{monthlyFees.filter(f => f.status === 'overdue').length}</span>
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
                    const basePrice = e.course?.currency === 'USD' ? (e.course.priceUSD ?? 0) : (e.course?.price ?? 0)
                    const totalDiscount = (e.discountApplied ?? 0) + (e.offerDiscountApplied ?? 0)
                    const price = Math.max(0, basePrice - totalDiscount)
                    const priceSuffix = e.course?.pricingType === 'monthly' ? '/mo' : e.course?.pricingType === 'per_session' ? '/session' : ''
                    const symbol = e.course?.currency === 'USD' ? '$' : 'Rs.'
                    const priceLabel = price > 0 ? `${symbol}${price.toLocaleString()}${priceSuffix}` : 'Free'
                    const isApproving = directApprove?.enrollmentId === e._id
                    return (
                      <tr key={e._id} className={`hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors ${isApproving ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {(e.student?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-xs">{e.student?.name ?? '—'}</p>
                              <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{e.student?.email ?? '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 max-w-[160px] truncate">{e.course?.title ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-neutral-400 capitalize">{e.course?.level ?? '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-black text-slate-900 dark:text-white">{priceLabel}</p>
                          {totalDiscount > 0 && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                              −{symbol}{totalDiscount.toLocaleString()} discount
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">
                          {new Date(e.enrolledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setDirectApprove({
                                enrollmentId: e._id,
                                studentName: e.student?.name ?? '—',
                                courseName: e.course?.title ?? '—',
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
      {activeTab === 'payments' && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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

      {/* Floating bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
          >
            <span className="text-sm font-bold text-slate-700 dark:text-white">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white transition-colors font-medium">Clear</button>
            <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
            >
              <Trash size={14} weight="bold" />
              Delete {selectedIds.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(allFilteredIds) : new Set())}
                    className="w-4 h-4 rounded accent-violet-500"
                  />
                </th>
                {['Student', 'Course', 'Method', 'Amount', 'Status', 'Date', 'Screenshot', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {loading && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && filteredMfPaid.length === 0 && (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No payments found</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p._id} className={`hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors group ${selectedIds.has(p._id) ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p._id)}
                      onChange={() => toggleSelect(p._id)}
                      className="w-4 h-4 rounded accent-violet-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(p.student?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{p.student?.name ?? '—'}</p>
                        <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{p.student?.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{p.course?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap capitalize">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{p.currency} {p.amount.toLocaleString()}</p>
                    {(p.discountApplied ?? 0) > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                        −{p.currency} {(p.discountApplied ?? 0).toLocaleString()} discount
                      </p>
                    )}
                    {p.coupon?.source === 'referral' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-bold mt-0.5">
                        <Gift size={9} weight="fill" /> {p.coupon.code}
                      </span>
                    )}
                  </td>
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
                      {p.status === 'approved' && !p.coupon && (
                        <button
                          onClick={() => handleReprocessReferral(p._id)}
                          disabled={reprocessingReferral === p._id}
                          title="Check & process referral reward for this payment"
                          className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 hover:bg-violet-100 flex items-center justify-center transition-colors disabled:opacity-50">
                          <Gift size={13} weight="fill" />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget({ id: p._id, studentName: p.student?.name ?? 'this payment' })}
                        title="Delete payment record"
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 flex items-center justify-center transition-colors">
                        <Trash size={13} weight="fill" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMfPaid.map(f => {
                const student = typeof f.student === 'object' ? f.student : null
                const course  = typeof f.course  === 'object' ? f.course  : null
                return (
                  <tr key={`mf-${f._id}`} className="hover:bg-violet-50/30 dark:hover:bg-violet-950/10 transition-colors bg-violet-50/10 dark:bg-violet-950/5">
                    <td className="px-4 py-3">
                      <input type="checkbox" disabled className="w-4 h-4 rounded accent-violet-500 opacity-30" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(student?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">{student?.name ?? '—'}</p>
                          <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[120px]">{(student as any)?.email ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap">{course?.title ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 whitespace-nowrap capitalize">
                      {f.method ? f.method.replace('_', ' ') : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{f.currency} {f.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">paid</span>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-violet-500 dark:text-violet-400">
                          <CalendarBlank size={10} /> {MONTHS[f.month - 1]} {f.year}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">
                      {f.paidDate
                        ? new Date(f.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : `${MONTHS[f.month - 1]} ${f.year}`}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 dark:text-neutral-700 text-xs">—</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 font-bold">Monthly Fee</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>}

      {/* ── Monthly Fees tab ── */}
      {activeTab === 'monthly-fees' && (() => {
        const mfFiltered = monthlyFees.filter(f => {
          const q = mfSearch.toLowerCase()
          const student = typeof f.student === 'object' ? f.student : null
          const course  = typeof f.course  === 'object' ? f.course  : null
          const matchQ = !q || (student?.name ?? '').toLowerCase().includes(q) || (student?.email ?? '').toLowerCase().includes(q) || (course?.title ?? '').toLowerCase().includes(q)
          const matchS = mfFilters.status === 'All' || f.status === mfFilters.status
          const matchY = !mfFilters.year || f.year === Number(mfFilters.year)
          const matchM = mfFilters.month === 'All' || f.month === Number(mfFilters.month)
          return matchQ && matchS && matchY && matchM
        })
        const mfPaidTotal    = mfFiltered.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
        const mfPendingTotal = mfFiltered.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
        const mfOverdueTotal = mfFiltered.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0)
        return (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Paid',    value: mfPaidTotal,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' },
                { label: 'Pending', value: mfPendingTotal, color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'     },
                { label: 'Overdue', value: mfOverdueTotal, color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'             },
              ].map(c => (
                <div key={c.label} className={`rounded-2xl border p-4 ${c.bg}`}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-xl font-black mt-1 ${c.color}`}>₨{c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <MagnifyingGlass size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={mfSearch} onChange={e => setMfSearch(e.target.value)} placeholder="Search student or course…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors" />
              </div>
              <select value={mfFilters.status} onChange={e => setMfFilters(p => ({ ...p, status: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                {['All','paid','pending','overdue'].map(v => <option key={v}>{v}</option>)}
              </select>
              <select value={mfFilters.year} onChange={e => setMfFilters(p => ({ ...p, year: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={mfFilters.month} onChange={e => setMfFilters(p => ({ ...p, month: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-neutral-300 outline-none focus:border-violet-500">
                <option value="All">All Months</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                      {['Student','Course','Month','Amount','Method','Status','Due Date','Paid Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                    {mfLoading && <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">Loading…</td></tr>}
                    {!mfLoading && mfFiltered.length === 0 && <tr><td colSpan={8} className="text-center py-10 text-slate-400 dark:text-neutral-600 text-sm">No monthly fee records found</td></tr>}
                    {mfFiltered.map(f => {
                      const student = typeof f.student === 'object' ? f.student : null
                      const course  = typeof f.course  === 'object' ? f.course  : null
                      return (
                        <tr key={f._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{student?.name ?? '—'}</p>
                            <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate max-w-[130px]">{student?.email ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 max-w-[140px] truncate">{course?.title ?? '—'}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-900 dark:text-white whitespace-nowrap">{MONTHS[f.month - 1]} {f.year}</td>
                          <td className="px-4 py-3 text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">₨{f.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-neutral-400">{f.method ? (MF_METHODS[f.method] ?? f.method) : '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${f.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : f.status === 'overdue' ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>{f.status}</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                          <td className="px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 whitespace-nowrap">{f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      })()}

      <AdminPaymentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => { setCreateModalOpen(false); fetchPayments() }}
      />

      {/* Single delete confirm */}
      <AnimatePresence>
      {deleteTarget && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && (setDeleteTarget(null), setDeactivateEnrollment(false))}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <Warning size={20} weight="fill" className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete Payment</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Delete payment for <span className="font-semibold">{deleteTarget.studentName}</span>?
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deactivateEnrollment}
                onChange={e => setDeactivateEnrollment(e.target.checked)}
                className="w-4 h-4 rounded accent-red-500"
              />
              Also deactivate the student's course enrollment
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
              <button
                onClick={() => { setDeleteTarget(null); setDeactivateEnrollment(false) }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Bulk delete confirm */}
      <AnimatePresence>
      {bulkDeleteOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && (setBulkDeleteOpen(false), setDeactivateEnrollment(false))}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <Warning size={20} weight="fill" className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delete {selectedIds.size} Payments</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300 mb-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deactivateEnrollment}
                onChange={e => setDeactivateEnrollment(e.target.checked)}
                className="w-4 h-4 rounded accent-red-500"
              />
              Also deactivate enrollments for all selected payments
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting…' : `Delete ${selectedIds.size}`}
              </button>
              <button
                onClick={() => { setBulkDeleteOpen(false); setDeactivateEnrollment(false) }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-white font-bold text-sm hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
