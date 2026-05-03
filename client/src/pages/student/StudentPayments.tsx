import { Receipt, CheckCircle, Clock, XCircle, DownloadSimple } from '@phosphor-icons/react'
import { MOCK_PAYMENTS } from './studentData'

export default function StudentPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Payments</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400">View and manage your payment history and receipts.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Description</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Method</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {MOCK_PAYMENTS.length > 0 ? MOCK_PAYMENTS.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-neutral-400 font-medium">
                    {new Date(payment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    {payment.description}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-neutral-800 text-xs font-semibold">
                      <Receipt size={14} />
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white text-right">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    {payment.status === 'completed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle size={12} weight="fill" /> Completed
                      </span>
                    )}
                    {payment.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <Clock size={12} weight="fill" /> Pending
                      </span>
                    )}
                    {payment.status === 'failed' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                        <XCircle size={12} weight="fill" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                    {payment.receiptUrl ? (
                      <button className="text-violet-600 hover:text-violet-700 font-semibold flex items-center justify-end gap-1 w-full">
                        <DownloadSimple size={16} />
                        Download
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-neutral-500">—</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}