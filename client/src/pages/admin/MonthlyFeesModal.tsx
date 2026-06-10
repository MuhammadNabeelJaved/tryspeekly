import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, PencilSimple, Trash, Check, Lightning, CurrencyCircleDollar } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { monthlyFeeService } from '../../services/monthly-fee.service'
import type { MonthlyFee } from '../../types/api'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAYMENT_METHODS = [
  { value: 'easypaisa',          label: 'Easypaisa'         },
  { value: 'jazzcash',           label: 'JazzCash'          },
  { value: 'nayapay',            label: 'NayaPay'           },
  { value: 'sadapay',            label: 'SadaPay'           },
  { value: 'zindigi',            label: 'Zindigi'           },
  { value: 'bank_local',         label: 'Bank (Local)'      },
  { value: 'bank_international', label: 'Bank (Intl)'       },
]

function statusClass(s: string) {
  if (s === 'paid')    return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
  if (s === 'overdue') return 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
  return 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
}

interface EnrollmentInfo {
  enrollmentId: string
  courseTitle: string
  courseLevel: string
  paymentCurrency: string
}

interface Props {
  student: { id: string; name: string; email: string }
  enrollments: EnrollmentInfo[]
  onClose: () => void
}

const EMPTY_FORM = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  amount: '',
  currency: 'PKR',
  method: '',
  status: 'pending',
  dueDate: '',
  paidDate: '',
  adminNote: '',
}

const EMPTY_GEN = {
  startMonth: new Date().getMonth() + 1,
  startYear: new Date().getFullYear(),
  months: 3,
  amount: '',
  currency: 'PKR',
  dayOfMonth: 1,
}

export default function MonthlyFeesModal({ student, enrollments, onClose }: Props) {
  const [fees, setFees] = useState<MonthlyFee[]>([])
  const [loading, setLoading] = useState(true)

  // Which enrollment's "Add" form is open
  const [addFor, setAddFor]   = useState<string | null>(null)
  const [genFor, setGenFor]   = useState<string | null>(null)
  const [editId, setEditId]   = useState<string | null>(null)
  const [delId,  setDelId]    = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [gen,  setGen]  = useState({ ...EMPTY_GEN })
  const [editForm, setEditForm] = useState<Partial<MonthlyFee & { amount: string }>>({})

  const loadFees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await monthlyFeeService.getFees({ studentId: student.id, limit: 500 })
      setFees(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [student.id])

  useEffect(() => { loadFees() }, [loadFees])

  const feesByEnrollment = (enrollmentId: string) =>
    fees.filter(f => f.enrollment === enrollmentId).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)

  const totalPaid    = fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
  const totalPending = fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
  const totalOverdue = fees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0)
  const currency = fees[0]?.currency === 'USD' ? '$' : '₨'

  // ── Add fee ──────────────────────────────────────────────────────────────────
  async function handleAdd(enrollmentId: string) {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      await monthlyFeeService.addFee({
        enrollmentId,
        month: Number(form.month),
        year: Number(form.year),
        amount: Number(form.amount),
        currency: form.currency,
        method: form.method || undefined,
        status: form.status,
        dueDate: form.dueDate || undefined,
        paidDate: form.status === 'paid' ? form.paidDate || undefined : undefined,
        adminNote: form.adminNote || undefined,
      })
      toast.success('Fee recorded')
      setAddFor(null)
      setForm({ ...EMPTY_FORM })
      await loadFees()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed to record fee')
    } finally {
      setSaving(false)
    }
  }

  // ── Generate ─────────────────────────────────────────────────────────────────
  async function handleGenerate(enrollmentId: string) {
    if (!gen.amount || Number(gen.amount) <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      const res = await monthlyFeeService.generateFees({
        enrollmentId,
        startMonth: Number(gen.startMonth),
        startYear: Number(gen.startYear),
        months: Number(gen.months),
        amount: Number(gen.amount),
        currency: gen.currency,
        dayOfMonth: gen.dayOfMonth || undefined,
      })
      toast.success(res.message ?? 'Fees generated')
      setGenFor(null)
      setGen({ ...EMPTY_GEN })
      await loadFees()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed to generate fees')
    } finally {
      setSaving(false)
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────
  function startEdit(fee: MonthlyFee) {
    setEditId(fee._id)
    setEditForm({
      amount:    fee.amount as unknown as string,
      currency:  fee.currency,
      method:    fee.method ?? '',
      status:    fee.status,
      dueDate:   fee.dueDate  ? fee.dueDate.split('T')[0]  : '',
      paidDate:  fee.paidDate ? fee.paidDate.split('T')[0] : '',
      adminNote: fee.adminNote ?? '',
    } as any)
  }

  async function handleUpdate() {
    if (!editId) return
    setSaving(true)
    try {
      await monthlyFeeService.updateFee(editId, {
        amount:    Number((editForm as any).amount),
        currency:  (editForm as any).currency,
        method:    (editForm as any).method || undefined,
        status:    (editForm as any).status,
        dueDate:   (editForm as any).dueDate  || undefined,
        paidDate:  (editForm as any).paidDate || undefined,
        adminNote: (editForm as any).adminNote || undefined,
      })
      toast.success('Fee updated')
      setEditId(null)
      await loadFees()
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed to update fee')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setSaving(true)
    try {
      await monthlyFeeService.deleteFee(id)
      toast.success('Fee record deleted')
      setDelId(null)
      setFees(prev => prev.filter(f => f._id !== id))
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? 'Failed to delete fee')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-xs text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors'
  const selectCls = inputCls

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Monthly Fee Tracking</h3>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{student.name} · {student.email}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Summary */}
          {fees.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Paid',    value: totalPaid,    color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' },
                { label: 'Pending',       value: totalPending, color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'     },
                { label: 'Overdue',       value: totalOverdue, color: 'text-red-600 dark:text-red-400',        bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'             },
              ].map(c => (
                <div key={c.label} className={`rounded-xl border p-3 ${c.bg}`}>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-lg font-black mt-0.5 ${c.color}`}>{currency}{c.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}</div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-neutral-500 text-sm">
              <CurrencyCircleDollar size={36} className="mx-auto mb-2 opacity-30" />
              No enrollments found — enroll this student in a course first
            </div>
          ) : (
            enrollments.map(en => {
              const enFees = feesByEnrollment(en.enrollmentId)
              const enPaid    = enFees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
              const enPending = enFees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0)
              const enOverdue = enFees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0)
              const cur = en.paymentCurrency === 'USD' ? '$' : '₨'

              return (
                <div key={en.enrollmentId} className="bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
                  {/* Enrollment header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{en.courseTitle}</p>
                      {en.courseLevel && <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{en.courseLevel}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      {enPaid    > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cur}{enPaid.toLocaleString()} paid</span>}
                      {enPending > 0 && <span className="text-amber-500 dark:text-amber-400 font-bold">{cur}{enPending.toLocaleString()} pending</span>}
                      {enOverdue > 0 && <span className="text-red-500 dark:text-red-400 font-bold">{cur}{enOverdue.toLocaleString()} overdue</span>}
                    </div>
                  </div>

                  {/* Fee table */}
                  {enFees.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[560px]">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-neutral-800">
                            {['Month', 'Amount', 'Method', 'Status', 'Due Date', 'Paid Date', 'Actions'].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                          {enFees.map(fee => (
                            <React.Fragment key={fee._id}>
                              <tr className="hover:bg-white dark:hover:bg-neutral-800/40 transition-colors">
                                {editId === fee._id ? (
                                  <>
                                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                      {MONTHS[(fee.month - 1)]} {fee.year}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input type="number" value={(editForm as any).amount ?? ''} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} className={inputCls} style={{ width: 80 }} />
                                    </td>
                                    <td className="px-3 py-2">
                                      <select value={(editForm as any).method ?? ''} onChange={e => setEditForm(p => ({ ...p, method: e.target.value }))} className={selectCls} style={{ minWidth: 100 }}>
                                        <option value="">— None —</option>
                                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-3 py-2">
                                      <select value={(editForm as any).status ?? 'pending'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={selectCls}>
                                        <option value="paid">Paid</option>
                                        <option value="pending">Pending</option>
                                        <option value="overdue">Overdue</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2">
                                      <input type="date" value={(editForm as any).dueDate ?? ''} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} style={{ width: 120 }} />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input type="date" value={(editForm as any).paidDate ?? ''} onChange={e => setEditForm(p => ({ ...p, paidDate: e.target.value }))} className={inputCls} style={{ width: 120 }} />
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex gap-1">
                                        <button onClick={handleUpdate} disabled={saving} className="w-6 h-6 rounded-md bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-colors"><Check size={11} weight="bold" /></button>
                                        <button onClick={() => setEditId(null)} className="w-6 h-6 rounded-md bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 flex items-center justify-center transition-colors"><X size={11} /></button>
                                      </div>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{MONTHS[fee.month - 1]} {fee.year}</td>
                                    <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{cur}{fee.amount.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-slate-500 dark:text-neutral-400">{fee.method ? PAYMENT_METHODS.find(m => m.value === fee.method)?.label ?? fee.method : '—'}</td>
                                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusClass(fee.status)}`}>{fee.status}</span></td>
                                    <td className="px-3 py-2 text-slate-500 dark:text-neutral-400 whitespace-nowrap">{fee.dueDate  ? new Date(fee.dueDate).toLocaleDateString('en-GB',  { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td className="px-3 py-2 text-slate-500 dark:text-neutral-400 whitespace-nowrap">{fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                                    <td className="px-3 py-2">
                                      <div className="flex gap-1">
                                        <button onClick={() => startEdit(fee)} className="w-6 h-6 rounded-md bg-slate-100 dark:bg-neutral-800 hover:bg-amber-100 dark:hover:bg-amber-950/40 text-slate-400 hover:text-amber-600 flex items-center justify-center transition-colors"><PencilSimple size={11} /></button>
                                        <button onClick={() => setDelId(fee._id)} className="w-6 h-6 rounded-md bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"><Trash size={11} /></button>
                                      </div>
                                    </td>
                                  </>
                                )}
                              </tr>
                              {/* Delete confirm inline */}
                              {delId === fee._id && (
                                <tr className="bg-red-50 dark:bg-red-950/20">
                                  <td colSpan={7} className="px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Delete {MONTHS[fee.month - 1]} {fee.year} fee record?</p>
                                      <button onClick={() => handleDelete(fee._id)} disabled={saving} className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">Delete</button>
                                      <button onClick={() => setDelId(null)} className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300 text-xs font-semibold transition-colors">Cancel</button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="px-4 py-4 text-xs text-slate-400 dark:text-neutral-500">No fee records yet for this course</p>
                  )}

                  {/* Add Fee form */}
                  <AnimatePresence>
                    {addFor === en.enrollmentId && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pt-3 pb-4 border-t border-slate-100 dark:border-neutral-800">
                          <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 mb-3">Record Fee Payment</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Month</label>
                              <select value={form.month} onChange={e => setForm(p => ({ ...p, month: Number(e.target.value) }))} className={selectCls}>
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Year</label>
                              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: Number(e.target.value) }))} className={inputCls} min={2020} max={2100} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Amount *</label>
                              <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="5000" className={inputCls} min={0} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Currency</label>
                              <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} className={selectCls}>
                                <option value="PKR">PKR</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Method</label>
                              <select value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))} className={selectCls}>
                                <option value="">— None —</option>
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Status</label>
                              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className={selectCls}>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="overdue">Overdue</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Due Date</label>
                              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className={inputCls} />
                            </div>
                            {form.status === 'paid' && (
                              <div>
                                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Paid Date</label>
                                <input type="date" value={form.paidDate} onChange={e => setForm(p => ({ ...p, paidDate: e.target.value }))} className={inputCls} />
                              </div>
                            )}
                            <div className="col-span-2 sm:col-span-4">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Note (optional)</label>
                              <input type="text" value={form.adminNote} onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))} placeholder="Any notes…" className={inputCls} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleAdd(en.enrollmentId)} disabled={saving} className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                              <Check size={12} weight="bold" />{saving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => { setAddFor(null); setForm({ ...EMPTY_FORM }) }} className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Generate fees form */}
                  <AnimatePresence>
                    {genFor === en.enrollmentId && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pt-3 pb-4 border-t border-slate-100 dark:border-neutral-800">
                          <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 mb-3">Bulk Generate Monthly Fee Records</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Start Month</label>
                              <select value={gen.startMonth} onChange={e => setGen(p => ({ ...p, startMonth: Number(e.target.value) }))} className={selectCls}>
                                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Start Year</label>
                              <input type="number" value={gen.startYear} onChange={e => setGen(p => ({ ...p, startYear: Number(e.target.value) }))} className={inputCls} min={2020} max={2100} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">No. of Months *</label>
                              <input type="number" value={gen.months} onChange={e => setGen(p => ({ ...p, months: Number(e.target.value) }))} className={inputCls} min={1} max={60} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Amount / Month *</label>
                              <input type="number" value={gen.amount} onChange={e => setGen(p => ({ ...p, amount: e.target.value }))} placeholder="5000" className={inputCls} min={0} />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Currency</label>
                              <select value={gen.currency} onChange={e => setGen(p => ({ ...p, currency: e.target.value }))} className={selectCls}>
                                <option value="PKR">PKR</option>
                                <option value="USD">USD</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-1">Due Day (1–31)</label>
                              <input type="number" value={gen.dayOfMonth} onChange={e => setGen(p => ({ ...p, dayOfMonth: Number(e.target.value) }))} placeholder="1" className={inputCls} min={1} max={31} />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleGenerate(en.enrollmentId)} disabled={saving} className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center gap-1.5">
                              <Lightning size={12} weight="fill" />{saving ? 'Generating…' : 'Generate'}
                            </button>
                            <button onClick={() => { setGenFor(null); setGen({ ...EMPTY_GEN }) }} className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  {addFor !== en.enrollmentId && genFor !== en.enrollmentId && (
                    <div className="flex gap-2 px-4 py-3 border-t border-slate-100 dark:border-neutral-800">
                      <button
                        onClick={() => { setAddFor(en.enrollmentId); setGenFor(null) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-violet-400 hover:text-violet-600 transition-colors"
                      >
                        <Plus size={12} weight="bold" />Record Fee
                      </button>
                      <button
                        onClick={() => { setGenFor(en.enrollmentId); setAddFor(null) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 text-xs font-semibold text-slate-600 dark:text-neutral-300 hover:border-violet-400 hover:text-violet-600 transition-colors"
                      >
                        <Lightning size={12} weight="fill" />Generate Months
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
