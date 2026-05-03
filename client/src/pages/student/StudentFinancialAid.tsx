import { Handshake, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import { MOCK_FINANCIAL_AID } from './studentData'

export default function StudentFinancialAid() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Financial Aid</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">View the status of your financial aid applications.</p>
        </div>
        <button className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-colors">
          Apply for Aid
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_FINANCIAL_AID.length > 0 ? MOCK_FINANCIAL_AID.map(aid => (
          <div key={aid.id} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Handshake size={20} weight="fill" />
              </div>
              <div>
                {aid.status === 'pending' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider"><Clock size={12} weight="fill" /> Pending</span>}
                {aid.status === 'under_review' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider"><Clock size={12} weight="fill" /> Under Review</span>}
                {aid.status === 'accepted' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider"><CheckCircle size={12} weight="fill" /> Approved</span>}
                {aid.status === 'rejected' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider"><XCircle size={12} weight="fill" /> Rejected</span>}
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{aid.courseName}</h3>
            
            <div className="space-y-2 text-sm text-slate-600 dark:text-neutral-400 mb-4">
              <p><strong className="text-slate-900 dark:text-neutral-200">Applied On:</strong> {new Date(aid.appliedAt).toLocaleDateString()}</p>
              <p><strong className="text-slate-900 dark:text-neutral-200">Requested Amount:</strong> PKR {aid.amountRequested.toLocaleString()}</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-slate-100 dark:border-neutral-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Your Message</p>
              <p className="text-xs text-slate-600 dark:text-neutral-400 line-clamp-2 italic">"{aid.message}"</p>
            </div>
          </div>
        )) : (
          <div className="col-span-2 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-neutral-700">
            <Handshake size={32} className="mx-auto text-slate-400 mb-3" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No Financial Aid Applications</p>
            <p className="text-xs text-slate-500 dark:text-neutral-400">You haven't applied for any financial aid yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}