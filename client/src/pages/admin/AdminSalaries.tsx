import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, PencilSimple, Trash, X, Check, Money, SpinnerGap,
  MagnifyingGlass, CaretRight, CalendarBlank, Warning,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { axiosClient } from '@/lib/axiosClient'
import { salaryService } from '@/services/salary.service'
import UserAvatar from '@/components/UserAvatar'
import type {
  SalaryPackage,
  SalaryPayment,
  SalaryType,
  SalaryPackageStatus,
  SalaryPaymentStatus,
} from '@/types/api'

// ─── Local types ──────────────────────────────────────────────────────────────

interface TeacherRow {
  _id: string
  name: string
  email: string
  profileImage?: string
  pkg: SalaryPackage | null
}

interface PackageFormValues {
  amount: number
  type: SalaryType
  customType: string
  startDate: string
  endDate: string
  status: SalaryPackageStatus
  notes: string
}

interface PaymentFormValues {
  amount: number
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: SalaryPaymentStatus
  paidDate: string
  notes: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<SalaryType, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  per_course: 'Per Course',
  hourly: 'Hourly',
  custom: 'Custom',
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    inactive: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
    paid: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    overdue: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors'

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminSalaries() {
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<TeacherRow | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<'package' | string | null>(null)

  const pkgForm = useForm<PackageFormValues>({
    defaultValues: { amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' },
  })
  const watchType = pkgForm.watch('type')

  const payForm = useForm<PaymentFormValues>({
    defaultValues: { amount: 0, periodLabel: '', periodStart: '', periodEnd: '', status: 'pending', paidDate: '', notes: '' },
  })
  const watchPayStatus = payForm.watch('status')

  // ─── Load data ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, pkgsRes] = await Promise.allSettled([
        axiosClient.get('/users', { params: { role: 'teacher', limit: 200 } }),
        salaryService.getAllPackages(),
      ])

      const users: { _id?: string; id?: string; name?: string; email?: string; profileImage?: string }[] =
        usersRes.status === 'fulfilled' ? (usersRes.value.data?.data ?? []) : []
      const pkgs: SalaryPackage[] = pkgsRes.status === 'fulfilled' ? (pkgsRes.value.data ?? []) : []
      const pkgMap = new Map(pkgs.map(p => [p.teacher._id, p]))

      setTeachers(
        users.map(u => ({
          _id: u._id ?? u.id ?? '',
          name: u.name ?? '',
          email: u.email ?? '',
          profileImage: u.profileImage,
          pkg: pkgMap.get(u._id ?? u.id ?? '') ?? null,
        }))
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Select teacher ──────────────────────────────────────────────────────────

  function openTeacher(row: TeacherRow) {
    setSelected(row)
    setShowPaymentForm(false)
    setEditingPayment(null)
    if (row.pkg) {
      pkgForm.reset({
        amount: row.pkg.amount,
        type: row.pkg.type,
        customType: row.pkg.customType ?? '',
        startDate: row.pkg.startDate.slice(0, 10),
        endDate: row.pkg.endDate ? row.pkg.endDate.slice(0, 10) : '',
        status: row.pkg.status,
        notes: row.pkg.notes ?? '',
      })
      loadPayments(row.pkg._id)
    } else {
      pkgForm.reset({ amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' })
      setPayments([])
    }
  }

  async function loadPayments(pkgId: string) {
    setPaymentsLoading(true)
    try {
      const res = await salaryService.getPackagePayments(pkgId)
      setPayments(res.data)
    } catch {
      setPayments([])
    } finally {
      setPaymentsLoading(false)
    }
  }

  // ─── Save package ────────────────────────────────────────────────────────────

  async function onSavePackage(values: PackageFormValues) {
    if (!selected) return
    setSaving(true)
    try {
      const payload = {
        amount: Number(values.amount),
        type: values.type,
        customType: values.type === 'custom' ? values.customType : undefined,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        status: values.status,
        notes: values.notes || undefined,
      }

      let updatedPkg: SalaryPackage
      if (selected.pkg) {
        const res = await salaryService.updatePackage(selected.pkg._id, payload)
        updatedPkg = res.data
        toast.success('Salary package updated')
      } else {
        const res = await salaryService.createPackage({ ...payload, teacher: selected._id })
        updatedPkg = res.data
        toast.success('Salary package created')
        loadPayments(updatedPkg._id)
      }

      const updatedRow: TeacherRow = { ...selected, pkg: updatedPkg }
      setSelected(updatedRow)
      setTeachers(prev => prev.map(t => (t._id === selected._id ? updatedRow : t)))
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to save package')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete package ──────────────────────────────────────────────────────────

  async function confirmDeletePackage() {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      await salaryService.deletePackage(selected.pkg._id)
      toast.success('Package deleted')
      const updatedRow: TeacherRow = { ...selected, pkg: null }
      setSelected(updatedRow)
      setTeachers(prev => prev.map(t => (t._id === selected._id ? updatedRow : t)))
      setPayments([])
      pkgForm.reset({ amount: 0, type: 'monthly', customType: '', startDate: '', endDate: '', status: 'active', notes: '' })
    } catch {
      toast.error('Failed to delete package')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  // ─── Save payment ────────────────────────────────────────────────────────────

  async function onSavePayment(values: PaymentFormValues) {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      const payload = {
        amount: Number(values.amount),
        periodLabel: values.periodLabel || undefined,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd || undefined,
        status: values.status,
        paidDate: values.status === 'paid' ? (values.paidDate || undefined) : undefined,
        notes: values.notes || undefined,
      }

      if (editingPayment) {
        const res = await salaryService.updatePayment(selected.pkg._id, editingPayment._id, payload)
        setPayments(prev => prev.map(p => (p._id === editingPayment._id ? res.data : p)))
        toast.success('Payment updated')
      } else {
        const res = await salaryService.addPayment(selected.pkg._id, payload)
        setPayments(prev => [res.data, ...prev])
        toast.success('Payment added')
      }

      setShowPaymentForm(false)
      setEditingPayment(null)
      payForm.reset()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to save payment')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete payment ──────────────────────────────────────────────────────────

  async function confirmDeletePayment(paymentId: string) {
    if (!selected?.pkg) return
    setSaving(true)
    try {
      await salaryService.deletePayment(selected.pkg._id, paymentId)
      setPayments(prev => prev.filter(p => p._id !== paymentId))
      toast.success('Payment deleted')
    } catch {
      toast.error('Failed to delete payment')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  function openEditPayment(p: SalaryPayment) {
    setEditingPayment(p)
    payForm.reset({
      amount: p.amount,
      periodLabel: p.periodLabel ?? '',
      periodStart: p.periodStart.slice(0, 10),
      periodEnd: p.periodEnd ? p.periodEnd.slice(0, 10) : '',
      status: p.status,
      paidDate: p.paidDate ? p.paidDate.slice(0, 10) : '',
      notes: p.notes ?? '',
    })
    setShowPaymentForm(true)
  }

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase()
    return !q || t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
  })

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-0 overflow-hidden">

      {/* ── Teacher List ── */}
      <div className={`flex flex-col border-r border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-all ${selected ? 'w-72 flex-shrink-0 hidden lg:flex' : 'flex-1'}`}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Salary Management</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
          </p>
          <div className="relative mt-3">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search teachers…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-neutral-800/50">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full animate-pulse bg-slate-200 dark:bg-neutral-800 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-3/4" />
                  <div className="h-2.5 rounded animate-pulse bg-slate-200 dark:bg-neutral-800 w-1/2" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No teachers found</div>
          ) : filtered.map(row => (
            <button
              key={row._id}
              onClick={() => openTeacher(row)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-left ${selected?._id === row._id ? 'bg-violet-50 dark:bg-violet-950/20' : ''}`}
            >
              <UserAvatar src={row.profileImage} name={row.name} size="md" className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{row.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">{row.email}</p>
                {row.pkg ? (
                  <p className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                    ₨{row.pkg.amount.toLocaleString()} / {TYPE_LABELS[row.pkg.type]}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 dark:text-neutral-600 mt-0.5">No package</p>
                )}
              </div>
              <CaretRight size={13} className="text-slate-300 dark:text-neutral-600 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col bg-slate-50 dark:bg-neutral-950 overflow-hidden"
          >
            {/* Panel header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <button
                onClick={() => setSelected(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 lg:hidden"
              >
                <X size={14} />
              </button>
              <UserAvatar src={selected.profileImage} name={selected.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{selected.name}</p>
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate">{selected.email}</p>
              </div>
              {selected.pkg && (
                <StatusBadge value={selected.pkg.status} />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* ── Package Form ── */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Money size={16} className="text-violet-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {selected.pkg ? 'Salary Package' : 'Assign Salary Package'}
                    </h3>
                  </div>
                  {selected.pkg && (
                    <button
                      onClick={() => setDeleteTarget('package')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash size={13} /> Delete
                    </button>
                  )}
                </div>

                <form onSubmit={pkgForm.handleSubmit(onSavePackage)} className="p-5 grid grid-cols-2 gap-4">
                  <Field label="Amount (PKR)">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      {...pkgForm.register('amount', { valueAsNumber: true })}
                      placeholder="75000"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Type">
                    <select {...pkgForm.register('type')} className={inputCls}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                      <option value="per_course">Per Course</option>
                      <option value="hourly">Hourly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </Field>

                  {watchType === 'custom' && (
                    <Field label="Custom Type Label">
                      <input {...pkgForm.register('customType')} placeholder="e.g. Bi-weekly" className={inputCls} />
                    </Field>
                  )}

                  <Field label="Start Date">
                    <input type="date" {...pkgForm.register('startDate')} className={inputCls} />
                  </Field>

                  <Field label="End Date (optional)">
                    <input type="date" {...pkgForm.register('endDate')} className={inputCls} />
                  </Field>

                  <Field label="Status">
                    <select {...pkgForm.register('status')} className={inputCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>

                  <div className="col-span-2">
                    <Field label="Notes (optional)">
                      <textarea
                        {...pkgForm.register('notes')}
                        rows={2}
                        placeholder="Any additional notes…"
                        className={`${inputCls} resize-none`}
                      />
                    </Field>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors"
                    >
                      {saving ? <SpinnerGap size={14} className="animate-spin" /> : <Check size={14} weight="bold" />}
                      {selected.pkg ? 'Save Changes' : 'Create Package'}
                    </button>
                  </div>
                </form>
              </div>

              {/* ── Payments ── */}
              {selected.pkg && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <CalendarBlank size={16} className="text-violet-500" />
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">Payment History</h3>
                      <span className="text-xs text-slate-400 dark:text-neutral-500">({payments.length})</span>
                    </div>
                    {!showPaymentForm && (
                      <button
                        onClick={() => { setShowPaymentForm(true); setEditingPayment(null); payForm.reset() }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        <Plus size={13} weight="bold" /> Add Payment
                      </button>
                    )}
                  </div>

                  {/* Inline payment form */}
                  <AnimatePresence>
                    {showPaymentForm && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-slate-100 dark:border-neutral-800"
                      >
                        <form onSubmit={payForm.handleSubmit(onSavePayment)} className="p-5 grid grid-cols-2 gap-4 bg-violet-50/40 dark:bg-violet-950/10">
                          <Field label="Amount (PKR)">
                            <input
                              type="number"
                              min={0}
                              step={100}
                              {...payForm.register('amount', { valueAsNumber: true })}
                              placeholder="75000"
                              className={inputCls}
                            />
                          </Field>

                          <Field label="Period Label">
                            <input {...payForm.register('periodLabel')} placeholder="e.g. May 2026" className={inputCls} />
                          </Field>

                          <Field label="Period Start">
                            <input type="date" {...payForm.register('periodStart')} className={inputCls} />
                          </Field>

                          <Field label="Period End (optional)">
                            <input type="date" {...payForm.register('periodEnd')} className={inputCls} />
                          </Field>

                          <Field label="Status">
                            <select {...payForm.register('status')} className={inputCls}>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="overdue">Overdue</option>
                            </select>
                          </Field>

                          {watchPayStatus === 'paid' && (
                            <Field label="Paid Date">
                              <input type="date" {...payForm.register('paidDate')} className={inputCls} />
                            </Field>
                          )}

                          <div className="col-span-2">
                            <Field label="Notes (optional)">
                              <input {...payForm.register('notes')} placeholder="Optional note…" className={inputCls} />
                            </Field>
                          </div>

                          <div className="col-span-2 flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setShowPaymentForm(false); setEditingPayment(null) }}
                              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={saving}
                              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                            >
                              {saving ? <SpinnerGap size={13} className="animate-spin" /> : <Check size={13} weight="bold" />}
                              {editingPayment ? 'Update Payment' : 'Add Payment'}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Payment list */}
                  {paymentsLoading ? (
                    <div className="p-8 flex justify-center">
                      <SpinnerGap size={24} className="animate-spin text-violet-500" />
                    </div>
                  ) : payments.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No payments recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
                      {payments.map(p => (
                        <div key={p._id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              ₨{p.amount.toLocaleString()}
                              {p.periodLabel && <span className="text-slate-400 dark:text-neutral-500 font-normal ml-1.5">— {p.periodLabel}</span>}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StatusBadge value={p.status} />
                              {p.paidDate && (
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                  Paid {new Date(p.paidDate).toLocaleDateString()}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                {new Date(p.periodStart).toLocaleDateString()}
                                {p.periodEnd && ` – ${new Date(p.periodEnd).toLocaleDateString()}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditPayment(p)}
                              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-colors"
                            >
                              <PencilSimple size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(p._id)}
                              className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Empty state (no teacher selected) ── */}
      {!selected && !loading && teachers.length > 0 && (
        <div className="hidden lg:flex flex-1 items-center justify-center text-slate-300 dark:text-neutral-700 flex-col gap-3">
          <Money size={48} weight="thin" />
          <p className="text-sm font-semibold">Select a teacher to manage their salary</p>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
                <Warning size={22} className="text-red-500" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">
                {deleteTarget === 'package' ? 'Delete Package?' : 'Delete Payment?'}
              </h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">
                {deleteTarget === 'package'
                  ? 'This will permanently delete the salary package and all its payment records.'
                  : 'This payment record will be permanently removed.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTarget === 'package' ? confirmDeletePackage() : confirmDeletePayment(deleteTarget)}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
