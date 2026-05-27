import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Tag, Gift, Users, Wallet, Plus, Trash, ToggleLeft, ToggleRight, Copy, Check, X } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { couponsService } from '@/services/coupons.service'
import { referralsService } from '@/services/referrals.service'
import { coursesService } from '@/services/courses.service'

type Tab = 'coupons' | 'settings' | 'rewards' | 'payouts'

export default function AdminReferrals() {
  const [activeTab, setActiveTab] = useState<Tab>('coupons')

  const tabs: { key: Tab; label: string; Icon: React.FC<any> }[] = [
    { key: 'coupons',  label: 'Coupon Codes',      Icon: Tag },
    { key: 'settings', label: 'Referral Settings',  Icon: Gift },
    { key: 'rewards',  label: 'Referral Rewards',   Icon: Users },
    { key: 'payouts',  label: 'Payout Requests',    Icon: Wallet },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Referrals & Coupons</h2>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">Manage coupon codes, referral reward rates, and payout requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6 w-fit">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? 'bg-white dark:bg-neutral-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'coupons'  && <CouponsTab />}
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'rewards'  && <RewardsTab />}
      {activeTab === 'payouts'  && <PayoutsTab />}
    </div>
  )
}

// ─── Tab 1: Coupon Codes ──────────────────────────────────────────────────────

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterSource, setFilterSource] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [courses, setCourses] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterSource) params.source = filterSource
      if (filterActive !== '') params.isActive = filterActive
      const res = await couponsService.getCoupons(params)
      if (res.success) setCoupons(res.data.coupons ?? res.data)
    } finally {
      setLoading(false)
    }
  }, [filterSource, filterActive])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    coursesService.getAdminCourses({ limit: 100 }).then(r => { if (r.success) setCourses(r.data) }).catch(() => {})
  }, [])

  async function handleToggle(id: string, current: boolean) {
    try {
      await couponsService.updateCoupon(id, { isActive: !current })
      load()
      toast.success(`Coupon ${current ? 'deactivated' : 'activated'}`)
    } catch { toast.error('Failed to update coupon') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return
    try {
      await couponsService.deleteCoupon(id)
      load()
      toast.success('Coupon deleted')
    } catch { toast.error('Failed to delete coupon') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <select
            value={filterSource}
            onChange={e => setFilterSource(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200"
          >
            <option value="">All Types</option>
            <option value="admin">Manual</option>
            <option value="referral">Referral</option>
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Plus size={15} weight="bold" />
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No coupons found</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Code', 'Type', 'Discount', 'Scope', 'Uses', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {coupons.map(c => (
                <tr key={c._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.source === 'referral' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                      {c.source === 'referral' ? 'Referral' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-neutral-300">
                    {c.discountType === 'percentage' ? `${c.discountValue}%` : `PKR ${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.scope === 'course' ? (c.course?.title || 'Course') : 'Platform-wide'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.usedCount}{c.maxUses !== null ? `/${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(c._id, c.isActive)} className="transition-colors">
                      {c.isActive
                        ? <ToggleRight size={22} weight="fill" className="text-violet-600" />
                        : <ToggleLeft size={22} className="text-slate-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {c.source === 'admin' && (
                      <button onClick={() => handleDelete(c._id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CreateCouponModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}

function CreateCouponModal({ courses, onClose, onSuccess }: { courses: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    code: '', discountType: 'percentage', discountValue: '', scope: 'platform', courseId: '', maxUses: '', expiresAt: '',
  })
  const [saving, setSaving] = useState(false)

  function autoGenerate() {
    setForm(f => ({ ...f, code: 'PROMO-' + Math.random().toString(36).substring(2, 7).toUpperCase() }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.discountValue) return toast.error('Code and discount value are required')
    setSaving(true)
    try {
      await couponsService.createCoupon({
        code: form.code,
        discountType: form.discountType as 'percentage' | 'fixed',
        discountValue: Number(form.discountValue),
        scope: form.scope as 'platform' | 'course',
        courseId: form.scope === 'course' ? form.courseId : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      })
      toast.success('Coupon created')
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 dark:text-white">Create Coupon</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Code</label>
            <div className="flex gap-2">
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE20"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm font-mono text-slate-900 dark:text-white"
              />
              <button type="button" onClick={autoGenerate} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-500 hover:text-violet-600 dark:text-neutral-400 dark:hover:text-violet-400 transition-colors">Auto</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '15' : '500'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Scope</label>
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="platform">Platform-wide (any course)</option>
              <option value="course">Specific course</option>
            </select>
          </div>
          {form.scope === 'course' && (
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Course</label>
              <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="">Select course…</option>
                {courses.map((c: any) => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Max Uses (optional)</label>
              <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Expiry Date (optional)</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors mt-2">
            {saving ? 'Creating…' : 'Create Coupon'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

// ─── Tab 2: Referral Settings ─────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState({
    enabled: false,
    refereeDiscountType: 'percentage',
    refereeDiscountValue: 0,
    referrerRewardType: 'percentage',
    referrerRewardValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    referralsService.getReferralSettings()
      .then(r => { if (r.success) setSettings(s => ({ ...s, ...r.data })) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await referralsService.updateReferralSettings(settings)
      toast.success('Referral settings saved')
    } catch { toast.error('Failed to save settings') } finally { setSaving(false) }
  }

  if (loading) return <div className="text-center py-12 text-slate-400">Loading…</div>

  return (
    <div className="max-w-lg">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Enable Referral System</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">Allow students to generate referral links</p>
          </div>
          <button onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))} className="transition-colors">
            {settings.enabled
              ? <ToggleRight size={28} weight="fill" className="text-violet-600" />
              : <ToggleLeft size={28} className="text-slate-400" />
            }
          </button>
        </div>

        <hr className="border-slate-100 dark:border-neutral-800" />

        {/* Referee discount */}
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">New Student Discount</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mb-3">Discount given to the referred (new) student</p>
          <div className="flex gap-3">
            <select value={settings.refereeDiscountType} onChange={e => setSettings(s => ({ ...s, refereeDiscountType: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </select>
            <input type="number" value={settings.refereeDiscountValue}
              onChange={e => setSettings(s => ({ ...s, refereeDiscountValue: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
            Preview: New student gets {settings.refereeDiscountType === 'percentage' ? `${settings.refereeDiscountValue}% off` : `PKR ${settings.refereeDiscountValue} off`}
          </p>
        </div>

        {/* Referrer reward */}
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">Referrer Reward</p>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mb-3">Reward earned by the student who referred</p>
          <div className="flex gap-3">
            <select value={settings.referrerRewardType} onChange={e => setSettings(s => ({ ...s, referrerRewardType: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="percentage">% of Course Price</option>
              <option value="fixed">Fixed Amount (PKR)</option>
            </select>
            <input type="number" value={settings.referrerRewardValue}
              onChange={e => setSettings(s => ({ ...s, referrerRewardValue: Number(e.target.value) }))}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2">
            Preview: Referrer earns {settings.referrerRewardType === 'percentage' ? `${settings.referrerRewardValue}% of course price` : `PKR ${settings.referrerRewardValue}`}
          </p>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab 3: Referral Rewards ──────────────────────────────────────────────────

function RewardsTab() {
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setLoading(true)
    referralsService.getAllRewards({ status: status || undefined })
      .then(r => { if (r.success) setRewards(r.data) })
      .finally(() => setLoading(false))
  }, [status])

  return (
    <div>
      <div className="mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="credited">Credited</option>
          <option value="paid_out">Paid Out</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No rewards found</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Referrer', 'Referee', 'Course', 'Discount Given', 'Reward Earned', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {rewards.map(r => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.referrer?.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{r.referee?.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">{r.course?.title}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">PKR {r.discountGiven}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">PKR {r.rewardAmount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tab 4: Payout Requests ───────────────────────────────────────────────────

function PayoutsTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [processing, setProcessing] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    referralsService.getPayoutRequests({ status: status || undefined })
      .then(r => { if (r.success) setRequests(r.data) })
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  async function handle(id: string, action: 'approve' | 'reject', note?: string) {
    setProcessing(id)
    try {
      await referralsService.processPayoutRequest(id, action, note)
      toast.success(`Payout ${action === 'approve' ? 'approved' : 'rejected'}`)
      load()
    } catch { toast.error('Failed to process request') } finally { setProcessing(null) }
  }

  return (
    <div>
      <div className="mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No payout requests</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                {['Student', 'Wallet Balance', 'Requested', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {requests.map(r => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.student?.name}<br /><span className="text-xs text-slate-400 font-normal">{r.student?.email}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">PKR {r.walletBalance}</td>
                  <td className="px-4 py-3 font-bold text-violet-600">PKR {r.amount}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handle(r._id, 'approve')}
                          disabled={processing === r._id}
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handle(r._id, 'reject', 'Rejected by admin')}
                          disabled={processing === r._id}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    credited: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    paid_out: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
