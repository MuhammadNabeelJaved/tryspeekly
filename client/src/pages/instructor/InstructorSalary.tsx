import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Money, CalendarBlank, SpinnerGap } from '@phosphor-icons/react'
import { salaryService } from '@/services/salary.service'
import type { SalaryPackage, SalaryPayment, SalaryType } from '@/types/api'

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

export default function InstructorSalary() {
  const [loading, setLoading] = useState(true)
  const [pkg, setPkg] = useState<SalaryPackage | null>(null)
  const [payments, setPayments] = useState<SalaryPayment[]>([])

  useEffect(() => {
    salaryService.getMyPackage()
      .then(res => {
        setPkg(res.data.package)
        setPayments(res.data.payments)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
