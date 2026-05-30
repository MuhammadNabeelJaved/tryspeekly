import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  MagnifyingGlass, Trash, UserMinus, PaperPlaneTilt,
  PencilSimple, Plus, CalendarBlank, X, Clock,
} from '@phosphor-icons/react'
import { newsletterService } from '@/services/newsletter.service'
import type { NewsletterSubscriber, NewsletterCampaign } from '@/services/newsletter.service'
import NewsletterEditor from '@/components/NewsletterEditor'

const STATUS_BADGE: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-neutral-400',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sending:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  sent:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const EDITABLE = ['draft', 'scheduled']

const fmt = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

export default function AdminNewsletter() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'campaigns'>('subscribers')

  // ─── Subscribers ──────────────────────────────────────────────────────────────
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [subLoading, setSubLoading] = useState(false)
  const [subSearch, setSubSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [subPage, setSubPage] = useState(1)
  const [subTotalPages, setSubTotalPages] = useState(1)
  const [subTotal, setSubTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(subSearch), 400)
    return () => clearTimeout(t)
  }, [subSearch])

  const fetchSubscribers = useCallback(async (page: number, search: string) => {
    setSubLoading(true)
    try {
      const res = await newsletterService.getSubscribers({ page, limit: 20, search })
      setSubscribers(res.data.subscribers)
      setSubTotalPages(res.data.pagination.totalPages)
      setSubTotal(res.data.pagination.total)
    } catch {
      toast.error('Failed to load subscribers')
    } finally {
      setSubLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'subscribers') fetchSubscribers(subPage, debouncedSearch)
  }, [activeTab, subPage, debouncedSearch, fetchSubscribers])

  const handleUnsubscribeSub = async (id: string) => {
    try {
      await newsletterService.unsubscribeSubscriber(id)
      toast.success('Subscriber unsubscribed')
      fetchSubscribers(subPage, debouncedSearch)
    } catch {
      toast.error('Failed to unsubscribe')
    }
  }

  const handleDeleteSub = async (id: string) => {
    if (!window.confirm('Permanently delete this subscriber? This cannot be undone.')) return
    try {
      await newsletterService.deleteSubscriber(id)
      toast.success('Subscriber deleted')
      fetchSubscribers(subPage, debouncedSearch)
    } catch {
      toast.error('Failed to delete subscriber')
    }
  }

  // ─── Campaigns ────────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [campLoading, setCampLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formSubject, setFormSubject] = useState('')
  const [formBody, setFormBody] = useState('')
  const [formSendType, setFormSendType] = useState<'now' | 'scheduled'>('now')
  const [formScheduledAt, setFormScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCampaigns = useCallback(async () => {
    setCampLoading(true)
    try {
      const res = await newsletterService.getCampaigns()
      setCampaigns(res.data)
    } catch {
      toast.error('Failed to load campaigns')
    } finally {
      setCampLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'campaigns') fetchCampaigns()
  }, [activeTab, fetchCampaigns])

  const resetForm = () => {
    setFormSubject('')
    setFormBody('')
    setFormSendType('now')
    setFormScheduledAt('')
    setEditingId(null)
  }

  const openEditForm = (c: NewsletterCampaign) => {
    setFormSubject(c.subject)
    setFormBody(c.htmlBody)
    setFormSendType(c.scheduledAt ? 'scheduled' : 'now')
    setFormScheduledAt(c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : '')
    setEditingId(c._id)
    setShowForm(true)
  }

  const saveCampaign = async (status: 'draft' | 'scheduled', sendNow = false) => {
    if (!formSubject.trim()) return toast.error('Subject is required')
    if (!formBody.trim() || formBody.replace(/<[^>]*>/g, '').trim() === '') return toast.error('Content is required')
    if (status === 'scheduled' && !formScheduledAt) return toast.error('Scheduled time is required')

    setSubmitting(true)
    try {
      if (sendNow) {
        let id = editingId
        if (!id) {
          const res = await newsletterService.createCampaign({ subject: formSubject, htmlBody: formBody, status: 'draft' })
          id = res.data._id
        } else {
          await newsletterService.updateCampaign(id, { subject: formSubject, htmlBody: formBody })
        }
        await newsletterService.sendCampaign(id!)
        toast.success('Campaign is being sent to all subscribers!')
      } else if (editingId) {
        await newsletterService.updateCampaign(editingId, {
          subject: formSubject,
          htmlBody: formBody,
          status,
          ...(status === 'scheduled' ? { scheduledAt: formScheduledAt } : {}),
        })
        toast.success(status === 'draft' ? 'Draft saved' : 'Campaign scheduled!')
      } else {
        await newsletterService.createCampaign({
          subject: formSubject,
          htmlBody: formBody,
          status,
          ...(status === 'scheduled' ? { scheduledAt: formScheduledAt } : {}),
        })
        toast.success(status === 'draft' ? 'Draft saved' : 'Campaign scheduled!')
      }
      setShowForm(false)
      resetForm()
      fetchCampaigns()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(message || 'Failed to save campaign')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDirectSend = async (id: string) => {
    if (!window.confirm('Send this campaign to all active subscribers now? This cannot be undone.')) return
    try {
      await newsletterService.sendCampaign(id)
      toast.success('Campaign is being sent!')
      fetchCampaigns()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(message || 'Failed to send')
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return
    try {
      await newsletterService.deleteCampaign(id)
      toast.success('Campaign deleted')
      fetchCampaigns()
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined
      toast.error(message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Newsletter</h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400 mt-1">
          Manage subscribers and send email campaigns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl w-fit">
        {(['subscribers', 'campaigns'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              activeTab === tab
                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── SUBSCRIBERS ── */}
      {activeTab === 'subscribers' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10">
          <div className="p-5 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700 dark:text-neutral-300">All Subscribers</span>
              <span className="px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-full">
                {subTotal} total
              </span>
            </div>
            <div className="relative w-full sm:w-72">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by email..."
                value={subSearch}
                onChange={(e) => { setSubSearch(e.target.value); setSubPage(1) }}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 placeholder-slate-400 dark:placeholder-neutral-600 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10">
                  {['Email', 'Status', 'Subscribed', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subLoading ? (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 dark:text-neutral-600">Loading...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-slate-400 dark:text-neutral-600">No subscribers found</td></tr>
                ) : subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-neutral-200">{sub.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                        sub.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-neutral-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500">{fmt(sub.subscribedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === 'active' && (
                          <button
                            onClick={() => handleUnsubscribeSub(sub._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                            title="Unsubscribe"
                          >
                            <UserMinus size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSub(sub._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {subTotalPages > 1 && (
            <div className="p-4 flex justify-center gap-2 border-t border-slate-100 dark:border-white/5">
              <button
                disabled={subPage === 1}
                onClick={() => setSubPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-neutral-400"
              >
                Prev
              </button>
              <span className="px-3 py-1.5 text-sm text-slate-500 dark:text-neutral-400">
                {subPage} / {subTotalPages}
              </span>
              <button
                disabled={subPage === subTotalPages}
                onClick={() => setSubPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-neutral-400"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-[0_4px_12px_rgba(124,58,237,0.3)]"
            >
              <Plus size={16} weight="bold" />
              New Campaign
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            {campLoading ? (
              <div className="text-center py-12 text-slate-400 dark:text-neutral-600">Loading...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-neutral-600">
                <p className="text-base font-medium mb-1">No campaigns yet</p>
                <p className="text-sm">Create your first newsletter campaign above.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">Subject</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide hidden md:table-cell">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wide hidden md:table-cell">Sent</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c._id} className="border-b border-slate-100 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-neutral-200">
                        <span className="block max-w-xs truncate">{c.subject}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[c.status] ?? ''}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500 hidden md:table-cell">
                        {c.sentAt ? fmt(c.sentAt) : c.scheduledAt ? fmt(c.scheduledAt) : fmt(c.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-neutral-500 hidden md:table-cell">
                        {c.status === 'sent' ? `${c.totalSent}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {EDITABLE.includes(c.status) && (
                            <>
                              <button
                                onClick={() => openEditForm(c)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                                title="Edit"
                              >
                                <PencilSimple size={15} />
                              </button>
                              <button
                                onClick={() => handleDirectSend(c._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                title="Send now"
                              >
                                <PaperPlaneTilt size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCampaign(c._id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete"
                              >
                                <Trash size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── CAMPAIGN FORM MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto pt-8 pb-8 px-4">
          <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Campaign' : 'New Campaign'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="Your newsletter subject..."
                  className="w-full px-4 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 placeholder-slate-400 dark:placeholder-neutral-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                  Content *
                </label>
                <NewsletterEditor value={formBody} onChange={setFormBody} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-2">
                  Send Options
                </label>
                <div className="flex gap-3">
                  {(['now', 'scheduled'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormSendType(type)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        formSendType === type
                          ? 'bg-violet-600 border-violet-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-neutral-400 hover:border-violet-400'
                      }`}
                    >
                      {type === 'now' ? <PaperPlaneTilt size={15} /> : <Clock size={15} />}
                      {type === 'now' ? 'Send now' : 'Schedule for later'}
                    </button>
                  ))}
                </div>
              </div>

              {formSendType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">
                    <CalendarBlank size={14} className="inline mr-1" />
                    Schedule Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-white dark:bg-neutral-800 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-900 dark:text-neutral-300 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => saveCampaign('draft')}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-neutral-300 rounded-xl transition-all disabled:opacity-50"
              >
                Save Draft
              </button>
              {formSendType === 'scheduled' ? (
                <button
                  onClick={() => saveCampaign('scheduled')}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <Clock size={15} />
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              ) : (
                <button
                  onClick={() => saveCampaign('draft', true)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all disabled:opacity-50"
                >
                  <PaperPlaneTilt size={15} />
                  {submitting ? 'Sending...' : 'Send Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
