import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Check, Wallet, ArrowDown, Clock, CheckCircle, XCircle } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { referralsService } from '@/services/referrals.service'
import { enrollmentsService } from '@/services/enrollments.service'

export default function StudentReferrals() {
  const [publicSettings, setPublicSettings] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [pendingPayout, setPendingPayout] = useState<any>(null)
  const [myCodes, setMyCodes] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [generatingGeneral, setGeneratingGeneral] = useState(false)
  const [generatingCourse, setGeneratingCourse] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [submittingPayout, setSubmittingPayout] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    referralsService.getPublicSettings().then(r => { if (r.success) setPublicSettings(r.data) }).catch(() => {})
    referralsService.getMyWallet().then(r => { if (r.success) { setWallet(r.data.wallet); setPendingPayout(r.data.pendingPayout) } }).catch(() => {})
    referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data.coupons ?? r.data) }).catch(() => {})
    referralsService.getMyRewards().then(r => { if (r.success) setRewards(r.data) }).catch(() => {})
    enrollmentsService.getMyEnrollments().then(r => { if (r.success) setEnrollments(r.data) }).catch(() => {})
  }, [])

  const generalCode = myCodes.find(c => c.scope === 'platform')
  const courseCodes = myCodes.filter(c => c.scope === 'course')

  async function handleGenerateGeneral() {
    setGeneratingGeneral(true)
    try {
      const res = await referralsService.generateCode()
      if (res.success) {
        referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data.coupons ?? r.data) })
        toast.success('General referral code generated!')
      }
    } catch { toast.error('Failed to generate code') } finally { setGeneratingGeneral(false) }
  }

  async function handleGenerateCourse() {
    if (!selectedCourse) return toast.error('Please select a course')
    setGeneratingCourse(true)
    try {
      const res = await referralsService.generateCode(selectedCourse)
      if (res.success) {
        referralsService.getMyCodes().then(r => { if (r.success) setMyCodes(r.data.coupons ?? r.data) })
        toast.success('Course referral link generated!')
        setSelectedCourse('')
      }
    } catch { toast.error('Failed to generate link') } finally { setGeneratingCourse(false) }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  async function handlePayoutRequest() {
    const amount = Number(payoutAmount)
    if (!amount || amount < 1) return toast.error('Enter a valid amount')
    if (wallet && amount > wallet.balance) return toast.error('Amount exceeds your balance')
    setSubmittingPayout(true)
    try {
      await referralsService.createPayoutRequest(amount)
      toast.success('Payout request submitted')
      setShowPayoutModal(false)
      setPayoutAmount('')
      referralsService.getMyWallet().then(r => { if (r.success) { setWallet(r.data.wallet); setPendingPayout(r.data.pendingPayout) } })
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to submit request')
    } finally { setSubmittingPayout(false) }
  }

  if (!publicSettings) return <div className="text-center py-12 text-slate-400">Loading…</div>

  if (!publicSettings.enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
          <Gift size={26} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-700 dark:text-neutral-200 mb-2">Referral Program Not Active</h3>
        <p className="text-sm text-slate-400 dark:text-neutral-500">The referral program is not available at this time.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Section 1: How It Works ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-5 text-white"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gift size={20} weight="fill" />
          </div>
          <div>
            <h3 className="font-black text-lg">How Referrals Work</h3>
            <p className="text-white/80 text-sm mt-1 leading-relaxed">
              Share your referral link → New student gets{' '}
              <strong>{publicSettings.refereeDiscountType === 'percentage' ? `${publicSettings.refereeDiscountValue}% off` : `PKR ${publicSettings.refereeDiscountValue} off`}</strong>{' '}
              → You earn{' '}
              <strong>{publicSettings.referrerRewardType === 'percentage' ? `${publicSettings.referrerRewardValue}% of the course price` : `PKR ${publicSettings.referrerRewardValue}`}</strong>{' '}
              after they pay.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: Wallet ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-violet-600" />
          Your Wallet
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Balance', value: `PKR ${wallet?.balance ?? 0}`, highlight: true },
            { label: 'Total Earned', value: `PKR ${wallet?.totalEarned ?? 0}`, highlight: false },
            { label: 'Total Paid Out', value: `PKR ${wallet?.totalPaidOut ?? 0}`, highlight: false },
          ].map(({ label, value, highlight }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${highlight ? 'bg-violet-50 dark:bg-violet-950/30' : 'bg-slate-50 dark:bg-neutral-800'}`}>
              <p className={`text-lg font-black ${highlight ? 'text-violet-600' : 'text-slate-900 dark:text-white'}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {pendingPayout ? (
          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <Clock size={15} />
            Payout request of PKR {pendingPayout.amount} is pending admin approval
          </div>
        ) : (
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={!wallet || wallet.balance < 1}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
          >
            <ArrowDown size={15} weight="bold" />
            Request Payout
          </button>
        )}

        {wallet?.transactions?.length > 0 && (
          <div className="mt-4 border-t border-slate-100 dark:border-neutral-800 pt-4">
            <p className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-2">Recent Transactions</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...wallet.transactions].reverse().slice(0, 10).map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {t.type === 'credit'
                      ? <CheckCircle size={14} className="text-emerald-500" />
                      : <XCircle size={14} className="text-red-400" />
                    }
                    <span className="text-slate-600 dark:text-neutral-300">{t.description}</span>
                  </div>
                  <span className={`font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'credit' ? '+' : '-'}PKR {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Section 3: Referral Codes ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Gift size={18} className="text-violet-600" />
          Your Referral Codes
        </h3>

        {/* General code */}
        <div className="mb-5">
          <p className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-2">General Code (any course)</p>
          {generalCode ? (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
              <code className="flex-1 font-mono text-sm font-bold text-violet-600 dark:text-violet-400">{generalCode.code}</code>
              <button
                onClick={() => copyToClipboard(generalCode.shareUrl, 'general')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {copied === 'general' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copied === 'general' ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateGeneral}
              disabled={generatingGeneral}
              className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {generatingGeneral ? 'Generating…' : 'Generate General Code'}
            </button>
          )}
        </div>

        {/* Per-course codes */}
        <div>
          <p className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-2">Per-Course Links</p>
          <div className="flex gap-3 mb-3">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white"
            >
              <option value="">Select an enrolled course…</option>
              {enrollments.map((e: any) => (
                <option key={e.course?._id} value={e.course?._id}>{e.course?.title}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateCourse}
              disabled={generatingCourse || !selectedCourse}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {generatingCourse ? '…' : 'Generate'}
            </button>
          </div>

          {courseCodes.length > 0 && (
            <div className="space-y-2">
              {courseCodes.map(c => (
                <div key={c._id} className="flex items-center gap-3 bg-slate-50 dark:bg-neutral-800 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 dark:text-neutral-500 truncate">{c.course?.title}</p>
                    <code className="font-mono text-sm font-bold text-violet-600 dark:text-violet-400">{c.code}</code>
                  </div>
                  <button
                    onClick={() => copyToClipboard(c.shareUrl, c._id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex-shrink-0"
                  >
                    {copied === c._id ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    {copied === c._id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Section 4: Referral History ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5"
      >
        <h3 className="font-black text-slate-900 dark:text-white mb-4">Referral History</h3>

        {rewards.length === 0 ? (
          <div className="text-center py-8 text-slate-400 dark:text-neutral-500 text-sm">
            No referrals yet. Share your code to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  {['Referee', 'Course', 'Discount Given', 'Your Reward', 'Status', 'Date'].map(h => (
                    <th key={h} className="pb-3 text-left text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                {rewards.map(r => (
                  <tr key={r._id}>
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{r.referee?.name || '—'}</td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-neutral-400">{r.course?.title}</td>
                    <td className="py-3 pr-4 text-slate-500 dark:text-neutral-400">PKR {r.discountGiven}</td>
                    <td className="py-3 pr-4 font-bold text-emerald-600">PKR {r.rewardAmount}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                        r.status === 'credited' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        r.status === 'paid_out' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      }`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-sm shadow-xl"
          >
            <h3 className="font-black text-slate-900 dark:text-white mb-1">Request Payout</h3>
            <p className="text-sm text-slate-400 dark:text-neutral-500 mb-4">Available balance: PKR {wallet?.balance ?? 0}</p>
            <input
              type="number"
              value={payoutAmount}
              onChange={e => setPayoutAmount(e.target.value)}
              placeholder="Enter amount"
              max={wallet?.balance}
              min={1}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowPayoutModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-bold text-slate-600 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handlePayoutRequest} disabled={submittingPayout} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold transition-colors">
                {submittingPayout ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
