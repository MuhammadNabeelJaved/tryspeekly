import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Money, CalendarBlank, SpinnerGap, PaperPlaneTilt, X, Check } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { salaryService } from '@/services/salary.service'
import type { SalaryPackage, SalaryPayment, SalaryRequest, SalaryType, CreateSalaryRequestDto } from '@/types/api'
import { getMethodById, getFaviconUrl } from '@/data/pakistanPaymentMethods'

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
    approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[value] ?? 'bg-slate-100 text-slate-500'}`}>
      {value.replace('_', ' ')}
    </span>
  )
}

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors'

export default function InstructorSalary() {
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<SalaryPackage | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])
  const [requests, setRequests] = useState<SalaryRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const [form, setForm] = useState<CreateSalaryRequestDto>({
    amount: 0,
    periodStart: '',
    periodLabel: '',
    periodEnd: '',
    note: '',
  })

  useEffect(() => {
    salaryService.getMyPackage()
      .then(res => {
        setPkg(res.data.package)
        setPayments(res.data.payments)
        if (res.data.package) loadRequests()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function loadRequests() {
    setRequestsLoading(true)
    salaryService.getMyRequests()
      .then(res => setRequests(res.data))
      .catch(() => {})
      .finally(() => setRequestsLoading(false))
  }

  const hasPending = requests.some(r => r.status === 'pending')

  function openForm() {
    setForm({
      amount: pkg?.amount ?? 0,
      periodStart: '',
      periodLabel: '',
      periodEnd: '',
      note: '',
    })
    setShowForm(true)
  }

  async function submitRequest() {
    if (!form.amount || !form.periodStart) {
      toast.error('Amount and period start are required')
      return
    }
    setSubmitting(true)
    try {
      const payload: CreateSalaryRequestDto = {
        amount: Number(form.amount),
        periodStart: form.periodStart,
      }
      if (form.periodLabel) payload.periodLabel = form.periodLabel
      if (form.periodEnd) payload.periodEnd = form.periodEnd
      if (form.note) payload.note = form.note

      const res = await salaryService.createRequest(payload)
      setRequests(prev => [res.data, ...prev])
      setShowForm(false)
      toast.success('Salary request submitted')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } }
      toast.error(axiosErr?.response?.data?.error?.message ?? 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  async function cancelReq(id: string) {
    setCancelling(id)
    try {
      await salaryService.cancelRequest(id)
      setRequests(prev => prev.filter(r => r._id !== id))
      toast.success('Request cancelled')
    } catch {
      toast.error('Failed to cancel request')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <SpinnerGap size={28} className="animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">My Salary</h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Your current salary package and payment history</p>
      </div>

      {/* Package card */}
      {pkg ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <Money size={16} className="text-violet-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Current Package</h3>
            <StatusBadge value={pkg.status} />
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Amount', value: `₨${pkg.amount.toLocaleString()} / ${pkg.customType || TYPE_LABELS[pkg.type]}` },
              { label: 'Start Date', value: new Date(pkg.startDate).toLocaleDateString() },
              { label: 'End Date', value: pkg.endDate ? new Date(pkg.endDate).toLocaleDateString() : 'Ongoing' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl p-3">
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}

            {pkg.notes && (
              <div className="col-span-2 sm:col-span-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40 rounded-xl p-3">
                <p className="text-[10px] text-violet-500 dark:text-violet-400 font-semibold uppercase tracking-wide mb-0.5">Notes</p>
                <p className="text-sm text-slate-700 dark:text-neutral-300">{pkg.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
            <Money size={28} className="text-slate-400 dark:text-neutral-500" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">No salary package assigned yet</h3>
          <p className="text-xs text-slate-400 dark:text-neutral-500">Please contact admin to set up your salary package.</p>
        </motion.div>
      )}

      {/* Request Salary section — only when package exists */}
      {pkg && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <PaperPlaneTilt size={16} className="text-violet-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Request Salary</h3>
              {requests.length > 0 && (
                <span className="text-xs text-slate-400 dark:text-neutral-500">({requests.length})</span>
              )}
            </div>
            {!showForm && (
              <button
                onClick={openForm}
                disabled={hasPending}
                title={hasPending ? 'You already have a pending request' : undefined}
                className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                + Request Salary
              </button>
            )}
          </div>

          {/* Inline request form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-b border-slate-100 dark:border-neutral-800"
              >
                <div className="p-5 grid grid-cols-2 gap-4 bg-violet-50/40 dark:bg-violet-950/10">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={form.amount}
                      onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period Label</label>
                    <input
                      value={form.periodLabel ?? ''}
                      onChange={e => setForm(f => ({ ...f, periodLabel: e.target.value }))}
                      placeholder="e.g. May 2026"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period Start *</label>
                    <input
                      type="date"
                      value={form.periodStart}
                      onChange={e => setForm(f => ({ ...f, periodStart: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Period End (optional)</label>
                    <input
                      type="date"
                      value={form.periodEnd ?? ''}
                      onChange={e => setForm(f => ({ ...f, periodEnd: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">Note (optional)</label>
                    <textarea
                      value={form.note ?? ''}
                      onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      maxLength={500}
                      rows={2}
                      placeholder="Any note for the admin…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="col-span-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitRequest}
                      disabled={submitting}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {submitting ? <SpinnerGap size={13} className="animate-spin" /> : <Check size={13} weight="bold" />}
                      Submit Request
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Request history */}
          {requestsLoading ? (
            <div className="p-8 flex justify-center">
              <SpinnerGap size={22} className="animate-spin text-violet-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No requests yet.</div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
              {requests.map(r => (
                <div key={r._id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">₨{r.amount.toLocaleString()}</span>
                      {r.periodLabel && <span className="text-sm text-slate-400 dark:text-neutral-500">— {r.periodLabel}</span>}
                      <StatusBadge value={r.status} />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-neutral-500 mt-0.5">
                      {new Date(r.periodStart).toLocaleDateString()}
                      {r.periodEnd && ` – ${new Date(r.periodEnd).toLocaleDateString()}`}
                      {' · '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    {r.note && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 italic">"{r.note}"</p>
                    )}
                    {r.adminReply && (
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        <span className="font-semibold">Admin:</span> {r.adminReply}
                      </p>
                    )}
                  </div>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => cancelReq(r._id)}
                      disabled={cancelling === r._id}
                      className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                      title="Cancel request"
                    >
                      {cancelling === r._id ? <SpinnerGap size={11} className="animate-spin" /> : <X size={11} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Payment history */}
      {pkg && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-neutral-800">
            <CalendarBlank size={16} className="text-violet-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Payment History</h3>
            <span className="text-xs text-slate-400 dark:text-neutral-500">({payments.length})</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-neutral-800">
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Period</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Payment Method</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Amount</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Status</th>
                    <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/50">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {p.periodLabel || new Date(p.periodStart).toLocaleDateString()}
                        </p>
                        {p.periodEnd && (
                          <p className="text-[10px] text-slate-400 dark:text-neutral-500">
                            {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {p.paymentMethod ? (
                          <div className="flex items-center gap-1.5">
                            {p.paymentMethod === 'cash' ? (
                              <Money size={16} className="text-emerald-500 flex-shrink-0" />
                            ) : getMethodById(p.paymentMethod)?.domain ? (
                              <img
                                src={getFaviconUrl(getMethodById(p.paymentMethod)!.domain)}
                                alt=""
                                className="w-4 h-4 rounded object-cover flex-shrink-0"
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : null}
                            <span className="text-sm text-slate-700 dark:text-neutral-300">
                              {getMethodById(p.paymentMethod)?.name ?? p.paymentMethod}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-neutral-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">₨{p.amount.toLocaleString()}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge value={p.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-600 dark:text-neutral-400">
                          {p.paidDate ? new Date(p.paidDate).toLocaleDateString() : '—'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
