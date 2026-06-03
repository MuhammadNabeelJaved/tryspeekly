import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Gift, Users, Wallet, Plus, Trash, ToggleLeft, ToggleRight, X, Percent, PencilSimple, ChartBar, CalendarBlank } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import { couponsService } from '@/services/coupons.service'
import { referralsService } from '@/services/referrals.service'
import { coursesService } from '@/services/courses.service'
import { offersService } from '@/services/offers.service'
import type { Offer } from '@/services/offers.service'

type Tab = 'coupons' | 'settings' | 'rewards' | 'payouts' | 'offers'

// ─── Shared bulk-select helpers ───────────────────────────────────────────────

/** Floating action bar shown when one or more rows are selected. */
function BulkBar({ count, onClear, onDelete }: { count: number; onClear: () => void; onDelete: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-700 min-w-max"
        >
          <span className="text-sm font-bold text-slate-700 dark:text-white">{count} selected</span>
          <button onClick={onClear} className="text-xs text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white transition-colors font-medium">Clear</button>
          <div className="w-px h-5 bg-slate-200 dark:bg-neutral-700" />
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
          >
            <Trash size={14} weight="bold" />
            Delete {count}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Confirmation modal for a bulk delete. */
function BulkDeleteModal({ open, count, noun, onClose, onConfirm }: {
  open: boolean
  count: number
  noun: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  if (!open) return null
  const handleConfirm = async () => {
    setLoading(true)
    try { await onConfirm(); onClose() } finally { setLoading(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <Trash size={20} weight="fill" className="text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Delete {count} {noun}{count !== 1 ? 's' : ''}?
            </h2>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
              This will permanently delete {count} {noun}{count !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
            {loading ? 'Deleting…' : `Delete ${count}`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const checkboxClass = 'w-4 h-4 rounded accent-violet-500 disabled:opacity-30 disabled:cursor-not-allowed'

export default function AdminReferrals() {
  const [activeTab, setActiveTab] = useState<Tab>('coupons')

  const tabs: { key: Tab; label: string; Icon: React.FC<any> }[] = [
    { key: 'offers',   label: 'Offers & Discounts', Icon: Percent },
    { key: 'coupons',  label: 'Coupon Codes',       Icon: Tag },
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

      {activeTab === 'offers'   && <OffersTab />}
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
  const [confirmModal, setConfirmModal] = useState<{ id: string } | null>(null)
  const [filterSource, setFilterSource] = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [courses, setCourses] = useState<any[]>([])
  const [showTracking, setShowTracking] = useState(false)
  const [tracking, setTracking] = useState<any[]>([])
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingTotal, setTrackingTotal] = useState(0)
  const [expiryModal, setExpiryModal] = useState<{ id: string; code: string; current: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const loadTracking = useCallback(async () => {
    setTrackingLoading(true)
    try {
      const res = await couponsService.getUsageTracking({ type: 'coupon', limit: 50 })
      if (res.success) {
        setTracking(res.data)
        setTrackingTotal(res.pagination.total)
      }
    } catch { toast.error('Failed to load usage tracking') }
    finally { setTrackingLoading(false) }
  }, [])

  const handleToggleTracking = () => {
    if (!showTracking && tracking.length === 0) loadTracking()
    setShowTracking(s => !s)
  }

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

  async function handleDeleteConfirmed(id: string) {
    try {
      await couponsService.deleteCoupon(id)
      load()
      toast.success('Coupon deleted')
    } catch { toast.error('Failed to delete coupon') }
  }

  // Only admin-created coupons can be deleted (referral coupons are system-managed).
  const selectableIds = coupons.filter(c => c.source === 'admin').map(c => c._id)
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id))
  const toggleSelect = (id: string) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    try {
      await couponsService.bulkDeleteCoupons(ids)
      setSelectedIds(new Set())
      toast.success(`${ids.length} coupon${ids.length !== 1 ? 's' : ''} deleted`)
      load()
    } catch { toast.error('Bulk delete failed') }
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTracking}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChartBar size={15} />
            {showTracking ? 'Hide Usage Log' : `Usage Log${trackingTotal > 0 ? ` (${trackingTotal})` : ''}`}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus size={15} weight="bold" />
            Create Coupon
          </button>
        </div>
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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(selectableIds) : new Set())}
                    disabled={selectableIds.length === 0}
                    className={checkboxClass}
                  />
                </th>
                {['Code', 'Type', 'Referrer', 'Discount', 'Scope', 'Uses', 'Expiry', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {coupons.map(c => (
                <tr key={c._id} className={`transition-colors ${selectedIds.has(c._id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/30'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c._id)}
                      onChange={() => toggleSelect(c._id)}
                      disabled={c.source !== 'admin'}
                      title={c.source !== 'admin' ? 'Referral coupons cannot be deleted' : undefined}
                      className={checkboxClass}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{c.code}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.source === 'referral' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                      {c.source === 'referral' ? 'Referral' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.referrer ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-neutral-200">{c.referrer.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">{c.referrer.email}</p>
                      </div>
                    ) : <span className="text-slate-300 dark:text-neutral-700 text-xs">—</span>}
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    {c.expiresAt ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                          {new Date(c.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        {new Date(c.expiresAt) < new Date() && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 w-fit">
                            Expired
                          </span>
                        )}
                      </div>
                    ) : <span className="text-slate-300 dark:text-neutral-700">—</span>}
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpiryModal({
                          id: c._id,
                          code: c.code,
                          current: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : '',
                        })}
                        title="Set expiry date"
                        className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <CalendarBlank size={15} />
                      </button>
                      {c.source === 'admin' && (
                        <button onClick={() => setConfirmModal({ id: c._id })} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash size={15} />
                        </button>
                      )}
                    </div>
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

      {expiryModal && (
        <SetExpiryModal
          couponId={expiryModal.id}
          couponCode={expiryModal.code}
          currentExpiry={expiryModal.current}
          onClose={() => setExpiryModal(null)}
          onSuccess={() => { setExpiryModal(null); load() }}
        />
      )}

      <ConfirmModal
        open={!!confirmModal}
        title="Delete Coupon?"
        message="This coupon will be permanently deleted and can no longer be used."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { const id = confirmModal!.id; setConfirmModal(null); handleDeleteConfirmed(id) }}
        onCancel={() => setConfirmModal(null)}
      />

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => setBulkOpen(true)} />
      <BulkDeleteModal open={bulkOpen} count={selectedIds.size} noun="coupon" onClose={() => setBulkOpen(false)} onConfirm={handleBulkDelete} />

      {showTracking && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-3">
            Coupon Usage Log
            {trackingTotal > 0 && (
              <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                ({trackingTotal} total uses)
              </span>
            )}
          </h3>
          {trackingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading…</div>
          ) : tracking.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No coupon usage recorded yet</div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                  <tr>
                    {['Date', 'Student', 'Course', 'Code', 'Discount Type', 'Amount Saved', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                  {tracking.map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(t.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{t.student?.name ?? '—'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">{t.student?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 text-xs max-w-[160px] truncate">
                        {t.course?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-violet-600 dark:text-violet-400 text-xs">
                        {t.coupon?.code ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 text-xs">
                        {t.coupon?.discountType === 'percentage' ? `${t.coupon.discountValue}%` : `PKR ${t.coupon?.discountValue ?? 0}`}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        PKR {t.discountApplied.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                          {t.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SetExpiryModal({
  couponId, couponCode, currentExpiry, onClose, onSuccess,
}: { couponId: string; couponCode: string; currentExpiry: string; onClose: () => void; onSuccess: () => void }) {
  const [expiresAt, setExpiresAt] = useState(currentExpiry)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await couponsService.updateCoupon(couponId, { expiresAt: expiresAt || null })
      toast.success(expiresAt ? `Expiry set to ${new Date(expiresAt).toLocaleDateString()}` : 'Expiry cleared')
      onSuccess()
    } catch { toast.error('Failed to update expiry') } finally { setSaving(false) }
  }

  const isExpired = expiresAt && new Date(expiresAt) < new Date()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-sm shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white">Set Expiry Date</h3>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5 font-mono">{couponCode}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5 block">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
            />
            {isExpired && (
              <p className="text-xs text-red-500 mt-1">This date is in the past — the code will be rejected immediately.</p>
            )}
            {!expiresAt && (
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Leave blank for no expiry (code never expires).</p>
            )}
          </div>

          <div className="flex gap-3">
            {expiresAt && (
              <button
                onClick={() => setExpiresAt('')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-bold text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    referralsService.getAllRewards({ status: status || undefined })
      .then(r => { if (r.success) setRewards(r.data) })
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => { load() }, [load])

  const allSelected = rewards.length > 0 && rewards.every(r => selectedIds.has(r._id))
  const toggleSelect = (id: string) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    try {
      await referralsService.bulkDeleteRewards(ids)
      setSelectedIds(new Set())
      toast.success(`${ids.length} reward${ids.length !== 1 ? 's' : ''} deleted`)
      load()
    } catch { toast.error('Bulk delete failed') }
  }

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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(rewards.map(r => r._id)) : new Set())}
                    disabled={rewards.length === 0}
                    className={checkboxClass}
                  />
                </th>
                {['Referrer', 'Referee', 'Course', 'Discount Given', 'Reward Earned', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {rewards.map(r => (
                <tr key={r._id} className={`transition-colors ${selectedIds.has(r._id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/30'}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(r._id)} onChange={() => toggleSelect(r._id)} className={checkboxClass} />
                  </td>
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

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => setBulkOpen(true)} />
      <BulkDeleteModal open={bulkOpen} count={selectedIds.size} noun="reward" onClose={() => setBulkOpen(false)} onConfirm={handleBulkDelete} />
    </div>
  )
}

// ─── Tab 4: Payout Requests ───────────────────────────────────────────────────

function PayoutsTab() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [processing, setProcessing] = useState<string | null>(null)
  const [actionPanel, setActionPanel] = useState<{ id: string; action: 'approve' | 'reject'; note: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    referralsService.getPayoutRequests({ status: statusFilter === 'all' ? undefined : statusFilter })
      .then(r => { if (r.success) setRequests(r.data) })
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const toggleSelect = (id: string) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })
  const selectMany = (ids: string[], on: boolean) =>
    setSelectedIds(p => { const s = new Set(p); ids.forEach(id => on ? s.add(id) : s.delete(id)); return s })

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    try {
      await referralsService.bulkDeletePayoutRequests(ids)
      setSelectedIds(new Set())
      toast.success(`${ids.length} request${ids.length !== 1 ? 's' : ''} deleted`)
      load()
    } catch { toast.error('Bulk delete failed') }
  }

  async function handle() {
    if (!actionPanel) return
    setProcessing(actionPanel.id)
    try {
      await referralsService.processPayoutRequest(actionPanel.id, actionPanel.action, actionPanel.note || undefined)
      toast.success(`Payout ${actionPanel.action === 'approve' ? 'approved' : 'rejected'}`)
      setActionPanel(null)
      load()
    } catch { toast.error('Failed to process request') } finally { setProcessing(null) }
  }

  const pending = requests.filter(r => r.status === 'pending')
  const history = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-700 dark:text-neutral-200">
          <option value="all">All Requests</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="text-xs text-slate-400 dark:text-neutral-500">{requests.length} total</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No payout requests found</div>
      ) : (
        <>
          {/* ── Pending section ── */}
          {(statusFilter === 'all' || statusFilter === 'pending') && pending.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Pending Requests ({pending.length})
              </h3>

              {/* Action panel */}
              {actionPanel && (
                <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 space-y-3">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {actionPanel.action === 'approve' ? '✓ Approve payout — balance will be deducted' : '✕ Reject payout request'}
                  </p>
                  <input
                    value={actionPanel.note}
                    onChange={e => setActionPanel(a => a ? { ...a, note: e.target.value } : a)}
                    placeholder={actionPanel.action === 'approve' ? 'Admin note (optional)' : 'Rejection reason (optional)'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                  />
                  <div className="flex gap-2">
                    <button onClick={handle} disabled={!!processing}
                      className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition-colors disabled:opacity-50 ${actionPanel.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      {processing ? 'Processing…' : 'Confirm'}
                    </button>
                    <button onClick={() => setActionPanel(null)}
                      className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-white hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={pending.length > 0 && pending.every(r => selectedIds.has(r._id))}
                            onChange={e => selectMany(pending.map(r => r._id), e.target.checked)}
                            className={checkboxClass}
                          />
                        </th>
                        {['Student', 'Wallet Balance', 'Requested Amount', 'Submitted', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                      {pending.map(r => (
                        <tr key={r._id} className={`transition-colors ${selectedIds.has(r._id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : actionPanel?.id === r._id ? 'bg-slate-50/80 dark:bg-neutral-800/40' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/30'}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(r._id)} onChange={() => toggleSelect(r._id)} className={checkboxClass} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.student?.name}</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500">{r.student?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-neutral-300 whitespace-nowrap">PKR {(r.walletBalance ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="text-base font-black text-violet-600 dark:text-violet-400">PKR {r.amount.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setActionPanel({ id: r._id, action: 'approve', note: '' })}
                                disabled={!!processing}
                                className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                              >Approve</button>
                              <button
                                onClick={() => setActionPanel({ id: r._id, action: 'reject', note: '' })}
                                disabled={!!processing}
                                className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                              >Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── History section ── */}
          {(statusFilter === 'all' || statusFilter === 'approved' || statusFilter === 'rejected') && history.length > 0 && (
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                History ({history.length})
              </h3>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={history.length > 0 && history.every(r => selectedIds.has(r._id))}
                            onChange={e => selectMany(history.map(r => r._id), e.target.checked)}
                            className={checkboxClass}
                          />
                        </th>
                        {['Student', 'Amount', 'Status', 'Submitted', 'Processed', 'Admin Note'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                      {history.map(r => (
                        <tr key={r._id} className={`transition-colors ${selectedIds.has(r._id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/30'}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(r._id)} onChange={() => toggleSelect(r._id)} className={checkboxClass} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.student?.name}</p>
                            <p className="text-xs text-slate-400 dark:text-neutral-500">{r.student?.email}</p>
                          </td>
                          <td className="px-4 py-3 font-black text-slate-900 dark:text-white whitespace-nowrap">PKR {r.amount.toLocaleString()}</td>
                          <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-3 text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 dark:text-neutral-500 whitespace-nowrap">
                            {r.processedAt
                              ? new Date(r.processedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 dark:text-neutral-400 max-w-[200px]">
                            {r.adminNote || <span className="text-slate-300 dark:text-neutral-600">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => setBulkOpen(true)} />
      <BulkDeleteModal open={bulkOpen} count={selectedIds.size} noun="payout request" onClose={() => setBulkOpen(false)} onConfirm={handleBulkDelete} />
    </div>
  )
}

// ─── Tab 0: Offers & Discounts ────────────────────────────────────────────────

function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editOffer, setEditOffer] = useState<Offer | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [showOfferTracking, setShowOfferTracking] = useState(false)
  const [offerTracking, setOfferTracking] = useState<any[]>([])
  const [offerTrackingLoading, setOfferTrackingLoading] = useState(false)
  const [offerTrackingTotal, setOfferTrackingTotal] = useState(0)

  const loadOfferTracking = useCallback(async () => {
    setOfferTrackingLoading(true)
    try {
      const res = await couponsService.getUsageTracking({ type: 'offer', limit: 50 })
      if (res.success) {
        setOfferTracking(res.data)
        setOfferTrackingTotal(res.pagination.total)
      }
    } catch { toast.error('Failed to load offer tracking') }
    finally { setOfferTrackingLoading(false) }
  }, [])

  const handleToggleOfferTracking = () => {
    if (!showOfferTracking && offerTracking.length === 0) loadOfferTracking()
    setShowOfferTracking(s => !s)
  }
  const [confirmModal, setConfirmModal] = useState<{ id: string } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await offersService.getAdminOffers()
      if (res.success) setOffers(res.data)
      else toast.error(res.message || 'Failed to load offers')
    } catch {
      toast.error('Failed to load offers')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    coursesService.getAdminCourses({ limit: 100 }).then(r => {
      if (r.success) setCourses(r.data)
    }).catch(() => { toast.error('Failed to load courses') })
  }, [])

  async function handleToggle(id: string, current: boolean) {
    try {
      await offersService.updateOffer(id, { isActive: !current })
      load()
      toast.success(`Offer ${current ? 'deactivated' : 'activated'}`)
    } catch { toast.error('Failed to update offer') }
  }

  async function handleDeleteConfirmed(id: string) {
    try {
      await offersService.deleteOffer(id)
      load()
      toast.success('Offer deleted')
    } catch { toast.error('Failed to delete offer') }
  }

  const allSelected = offers.length > 0 && offers.every(o => selectedIds.has(o._id))
  const toggleSelect = (id: string) =>
    setSelectedIds(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s })

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds)
    try {
      await offersService.bulkDeleteOffers(ids)
      setSelectedIds(new Set())
      toast.success(`${ids.length} offer${ids.length !== 1 ? 's' : ''} deleted`)
      load()
    } catch { toast.error('Bulk delete failed') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          Auto-applied discounts shown on course pages. Course-specific offers take priority over platform-wide.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-neutral-700 rounded-xl transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleToggleOfferTracking}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-neutral-700 rounded-xl transition-colors"
          >
            <ChartBar size={15} />
            {showOfferTracking ? 'Hide Usage' : `Usage Log${offerTrackingTotal > 0 ? ` (${offerTrackingTotal})` : ''}`}
          </button>
          <button
            onClick={() => { setEditOffer(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus size={15} weight="bold" />
            Create Offer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading…</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No offers yet</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={e => setSelectedIds(e.target.checked ? new Set(offers.map(o => o._id)) : new Set())}
                    disabled={offers.length === 0}
                    className={checkboxClass}
                  />
                </th>
                {['Title', 'Discount', 'Scope', 'Speed', 'Duration', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {offers.map(o => (
                <tr key={o._id} className={`transition-colors ${selectedIds.has(o._id) ? 'bg-violet-50/60 dark:bg-violet-900/10' : 'hover:bg-slate-50 dark:hover:bg-neutral-800/30'}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(o._id)} onChange={() => toggleSelect(o._id)} className={checkboxClass} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {o.title}
                    {o.bannerText && (
                      <p className="text-[11px] text-slate-400 dark:text-neutral-500 font-normal mt-0.5 truncate max-w-[200px]">{o.bannerText}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-violet-600 dark:text-violet-400">
                    {o.discountType === 'percentage' ? `${o.discountValue}%` : `PKR ${o.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {o.scope === 'course' ? (o.course?.title || 'Course') : 'All Courses'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                    {o.marqueeSpeedSeconds ?? 60}s
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {o.startsAt ? new Date(o.startsAt).toLocaleDateString() : '—'}
                    {' → '}
                    {o.endsAt ? new Date(o.endsAt).toLocaleDateString() : 'No end'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(o._id, o.isActive)} className="transition-colors">
                      {o.isActive
                        ? <ToggleRight size={22} weight="fill" className="text-violet-600" />
                        : <ToggleLeft size={22} className="text-slate-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditOffer(o); setShowModal(true) }}
                        className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button onClick={() => setConfirmModal({ id: o._id })} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <OfferModal
          courses={courses}
          offer={editOffer}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}

      <ConfirmModal
        open={!!confirmModal}
        title="Delete Offer?"
        message="This offer will be permanently removed and will no longer be applied to any courses."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { const id = confirmModal!.id; setConfirmModal(null); handleDeleteConfirmed(id) }}
        onCancel={() => setConfirmModal(null)}
      />

      <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} onDelete={() => setBulkOpen(true)} />
      <BulkDeleteModal open={bulkOpen} count={selectedIds.size} noun="offer" onClose={() => setBulkOpen(false)} onConfirm={handleBulkDelete} />

      {showOfferTracking && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-neutral-200 mb-3">
            Offer Usage Log
            {offerTrackingTotal > 0 && (
              <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-neutral-500">
                ({offerTrackingTotal} total applications)
              </span>
            )}
          </h3>
          {offerTrackingLoading ? (
            <div className="text-center py-8 text-slate-400">Loading…</div>
          ) : offerTracking.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No offer usage recorded yet</div>
          ) : (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50">
                  <tr>
                    {['Date', 'Student', 'Course', 'Offer Name', 'Discount', 'Amount Saved', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
                  {offerTracking.map(t => (
                    <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(t.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{t.student?.name ?? '—'}</p>
                        <p className="text-[11px] text-slate-400 dark:text-neutral-500">{t.student?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300 text-xs max-w-[160px] truncate">
                        {t.course?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-violet-600 dark:text-violet-400 text-xs">
                        {t.offer?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 text-xs">
                        {t.offer?.discountType === 'percentage' ? `${t.offer.discountValue}%` : `PKR ${t.offer?.discountValue ?? 0}`}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        PKR {t.offerDiscountApplied.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${t.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
                          {t.isActive ? 'Active' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OfferModal({
  courses, offer, onClose, onSuccess,
}: { courses: any[]; offer: Offer | null; onClose: () => void; onSuccess: () => void }) {
  const isEdit = !!offer
  const [form, setForm] = useState({
    title: offer?.title ?? '',
    bannerText: offer?.bannerText ?? '',
    marqueeSpeedSeconds: (offer?.marqueeSpeedSeconds ?? 60).toString(),
    discountType: offer?.discountType ?? 'percentage',
    discountValue: offer?.discountValue?.toString() ?? '',
    scope: offer?.scope ?? 'platform',
    courseId: offer?.course?._id ?? '',
    isActive: offer?.isActive ?? true,
    startsAt: offer?.startsAt ? offer.startsAt.slice(0, 10) : '',
    endsAt: offer?.endsAt ? offer.endsAt.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.discountValue) return toast.error('Title and discount value are required')
    if (form.scope === 'course' && !form.courseId) return toast.error('Select a course')
    setSaving(true)
    try {
      const dto = {
        title: form.title,
        bannerText: form.bannerText,
        marqueeSpeedSeconds: Number(form.marqueeSpeedSeconds),
        discountType: form.discountType as 'percentage' | 'fixed',
        discountValue: Number(form.discountValue),
        scope: form.scope as 'platform' | 'course',
        courseId: form.scope === 'course' ? form.courseId : undefined,
        isActive: form.isActive,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      }
      if (isEdit && offer) {
        await offersService.updateOffer(offer._id, dto)
        toast.success('Offer updated')
      } else {
        await offersService.createOffer(dto)
        toast.success('Offer created')
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error
        ? ((err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message ?? err.message)
        : 'Failed to save offer'
      toast.error(message)
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-6 w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-slate-900 dark:text-white">{isEdit ? 'Edit Offer' : 'Create Offer'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Eid Sale"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Banner Text (shown in ticker)</label>
            <input value={form.bannerText} onChange={e => setForm(f => ({ ...f, bannerText: e.target.value }))}
              placeholder="🎉 Eid Sale — 30% off all courses!"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block">Marquee Speed</label>
              <span className="text-xs font-black text-violet-600 dark:text-violet-400">{form.marqueeSpeedSeconds}s</span>
            </div>
            <input
              type="range"
              min="20"
              max="120"
              step="5"
              value={form.marqueeSpeedSeconds}
              onChange={e => setForm(f => ({ ...f, marqueeSpeedSeconds: e.target.value }))}
              className="w-full accent-violet-600"
            />
            <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400 dark:text-neutral-500">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Type</label>
              <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (PKR)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Value</label>
              <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percentage' ? '30' : '500'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Scope</label>
            <select value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white">
              <option value="platform">All Courses (Platform-wide)</option>
              <option value="course">Specific Course</option>
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
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">Start Date (optional)</label>
              <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1 block">End Date (optional)</label>
              <input type="date" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white" />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
              {form.isActive
                ? <ToggleRight size={24} weight="fill" className="text-violet-600" />
                : <ToggleLeft size={24} className="text-slate-400" />
              }
            </button>
            <span className="text-sm text-slate-600 dark:text-neutral-300">{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors mt-2">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Offer'}
          </button>
        </form>
      </motion.div>
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
