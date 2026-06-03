import { useState, useEffect, useCallback } from 'react'
import {
  Envelope, ToggleLeft, ToggleRight, ArrowCounterClockwise,
  CheckCircle, XCircle, Clock, MagnifyingGlass, Trash, PaperPlaneTilt,
  CaretDown, CaretUp,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { emailService } from '@/services/email.service'
import type { EmailSetting, EmailTemplate, EmailLog, EmailStats } from '@/services/email.service'
import ConfirmModal from '@/components/ConfirmModal'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Authentication',
  payments: 'Payments',
  courses: 'Courses',
  financial_aid: 'Financial Aid',
  live_classes: 'Live Classes',
  assignments: 'Assignments',
  salary: 'Salary',
  reviews: 'Reviews',
  offers: 'Offers & Discounts',
  contact: 'Contact',
  referrals: 'Referrals & Payouts',
  support: 'Support',
  team: 'Team',
}

const CATEGORY_ORDER = ['auth', 'payments', 'courses', 'financial_aid', 'live_classes', 'assignments', 'salary', 'reviews', 'offers', 'referrals', 'support', 'contact', 'team']

function groupByCategory(settings: EmailSetting[]) {
  const grouped: Record<string, EmailSetting[]> = {}
  for (const s of settings) {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push(s)
  }
  return grouped
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'sent') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider">
      <CheckCircle size={10} weight="fill" /> Sent
    </span>
  )
  if (status === 'failed') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
      <XCircle size={10} weight="fill" /> Failed
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 text-[10px] font-bold uppercase tracking-wider">
      <Clock size={10} weight="fill" /> Skipped
    </span>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const [settings, setSettings] = useState<EmailSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    emailService.getSettings()
      .then(r => { if (r.success) setSettings(r.data) })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (type: string, current: boolean) => {
    setSaving(type)
    try {
      const r = await emailService.updateSetting(type, !current)
      if (r.success) {
        setSettings(prev => prev.map(s => s.type === type ? { ...s, enabled: !current } : s))
        toast.success(r.message || 'Setting updated')
      }
    } catch { toast.error('Failed to update') }
    finally { setSaving(null) }
  }

  const toggleAll = async (enabled: boolean) => {
    setSaving('all')
    try {
      const updates = settings.map(s => ({ type: s.type, enabled }))
      const r = await emailService.bulkUpdateSettings(updates)
      if (r.success) {
        setSettings(prev => prev.map(s => ({ ...s, enabled })))
        toast.success(enabled ? 'All emails enabled' : 'All emails disabled')
      }
    } catch { toast.error('Failed to update') }
    finally { setSaving(null) }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}
    </div>
  )

  const grouped = groupByCategory(settings)
  const enabledCount = settings.filter(s => s.enabled).length

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-200 dark:border-neutral-700">
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{enabledCount} / {settings.length} email types enabled</p>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">Toggle individual email triggers on or off</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => toggleAll(true)} disabled={saving === 'all'}
            className="px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
            Enable All
          </button>
          <button onClick={() => toggleAll(false)} disabled={saving === 'all'}
            className="px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
            Disable All
          </button>
        </div>
      </div>

      {/* Grouped settings */}
      {CATEGORY_ORDER.filter(cat => grouped[cat]?.length > 0).map(cat => (
        <div key={cat} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(p => ({ ...p, [cat]: !p[cat] }))}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors"
          >
            <span className="text-sm font-bold text-slate-900 dark:text-white">{CATEGORY_LABELS[cat] ?? cat}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                {grouped[cat].filter(s => s.enabled).length}/{grouped[cat].length} enabled
              </span>
              {collapsed[cat] ? <CaretDown size={14} className="text-slate-400" /> : <CaretUp size={14} className="text-slate-400" />}
            </div>
          </button>

          {!collapsed[cat] && (
            <div className="divide-y divide-slate-100 dark:divide-neutral-800">
              {grouped[cat].map(setting => (
                <div key={setting.type} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{setting.name}</p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 line-clamp-1">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => toggle(setting.type, setting.enabled)}
                    disabled={saving === setting.type}
                    className="flex-shrink-0 transition-opacity disabled:opacity-50"
                    title={setting.enabled ? 'Disable' : 'Enable'}
                  >
                    {setting.enabled
                      ? <ToggleRight size={32} weight="fill" className="text-violet-600" />
                      : <ToggleLeft size={32} className="text-slate-300 dark:text-neutral-600" />
                    }
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selected, setSelected] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTemplate, setLoadingTemplate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [subject, setSubject] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    emailService.getTemplates()
      .then(r => { if (r.success) setTemplates(r.data) })
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false))
  }, [])

  const selectTemplate = async (type: string) => {
    setLoadingTemplate(true)
    try {
      const r = await emailService.getTemplate(type)
      if (r.success) {
        setSelected(r.data)
        setSubject(r.data.subject)
        setHtmlBody(r.data.htmlBody ?? '')
        setPreviewMode(false)
      }
    } catch { toast.error('Failed to load template') }
    finally { setLoadingTemplate(false) }
  }

  const save = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const r = await emailService.updateTemplate(selected.type, { subject, htmlBody })
      if (r.success) {
        toast.success('Template saved')
        setTemplates(prev => prev.map(t => t.type === selected.type ? { ...t, isCustomized: true } : t))
        setSelected(prev => prev ? { ...prev, isCustomized: true } : prev)
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const reset = () => {
    if (!selected) return
    setConfirmModal({
      title: 'Reset Template?',
      message: 'This will restore the default template. Your customizations will be permanently lost.',
      onConfirm: async () => {
        setConfirmModal(null)
        setResetting(true)
    try {
      const r = await emailService.resetTemplate(selected.type)
      if (r.success) {
        toast.success('Template reset to default')
        setSubject(r.data.subject)
        setHtmlBody(r.data.htmlBody ?? '')
        setTemplates(prev => prev.map(t => t.type === selected.type ? { ...t, isCustomized: false } : t))
        setSelected(prev => prev ? { ...prev, isCustomized: false } : prev)
      }
      } catch { toast.error('Failed to reset') }
        finally { setResetting(false) }
      },
    })
  }

  const sendTest = async () => {
    if (!selected || !testEmail.trim()) return
    setSendingTest(true)
    try {
      const r = await emailService.sendTestEmail(selected.type, testEmail.trim())
      if (r.success) toast.success(`Test email sent to ${testEmail}`)
      else toast.error(r.message || 'Failed to send test')
    } catch { toast.error('Failed to send test email') }
    finally { setSendingTest(false) }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Template list */}
      <div className="lg:col-span-1 space-y-1.5">
        <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-2">Select Template</p>
        {templates.map(t => (
          <button
            key={t.type}
            onClick={() => selectTemplate(t.type)}
            className={`w-full text-left px-3.5 py-3 rounded-xl border transition-all text-sm ${
              selected?.type === t.type
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-violet-300 dark:hover:border-violet-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold truncate">{t.name}</span>
              {t.isCustomized && (
                <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full ml-2">CUSTOM</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="lg:col-span-2">
        {loadingTemplate ? (
          <div className="h-64 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-neutral-500 text-sm">
            <Envelope size={32} className="mb-2 opacity-40" />
            Select a template to edit
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selected.name}</h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Variables: {selected.variables.map(v => `{{${v}}}`).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewMode(p => !p)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                {selected.isCustomized && (
                  <button onClick={reset} disabled={resetting}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 flex items-center gap-1">
                    <ArrowCounterClockwise size={12} /> Reset
                  </button>
                )}
                <button onClick={save} disabled={saving}
                  className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-neutral-400 mb-1">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-neutral-400 mb-1">
                {previewMode ? 'Preview' : 'HTML Body'}
              </label>
              {previewMode ? (
                <div className="rounded-xl border border-slate-200 dark:border-neutral-700 overflow-hidden bg-white" style={{ height: '420px', overflow: 'auto' }}>
                  <iframe srcDoc={htmlBody} title="Email preview" className="w-full" style={{ height: '420px', border: 'none' }} />
                </div>
              ) : (
                <textarea
                  value={htmlBody}
                  onChange={e => setHtmlBody(e.target.value)}
                  rows={16}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono custom-scrollbar resize-none"
                />
              )}
            </div>

            {/* Send test */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-200 dark:border-neutral-700">
              <input
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button onClick={sendTest} disabled={sendingTest || !testEmail.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
                <PaperPlaneTilt size={12} weight="bold" />
                {sendingTest ? 'Sending…' : 'Send Test'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title ?? ''}
        message={confirmModal?.message ?? ''}
        confirmLabel="Reset"
        variant="warning"
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  )
}

// ─── Logs Tab ─────────────────────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [clearing, setClearing] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  const fetchLogs = useCallback(() => {
    setLoading(true)
    emailService.getLogs({ page, limit: 30, status: statusFilter || undefined, type: typeFilter || undefined, search: search || undefined })
      .then(r => {
        if (r.success) {
          setLogs(r.data)
          setTotal(r.pagination.total)
          setTotalPages(r.pagination.totalPages)
        }
      })
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false))
  }, [page, statusFilter, typeFilter, search])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const clearOldLogs = () => {
    setConfirmModal({
      title: 'Delete All Logs?',
      message: 'This will permanently delete all email delivery logs. This cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(null)
        setClearing(true)
        try {
          const r = await emailService.clearLogs()
          if (r.success) { toast.success(r.message || 'All logs cleared'); fetchLogs() }
        } catch { toast.error('Failed to clear logs') }
        finally { setClearing(false) }
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by email…"
            className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 w-48" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500">
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="failed">Failed</option>
          <option value="skipped">Skipped</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-neutral-400">{total} total logs</span>
          <button onClick={clearOldLogs} disabled={clearing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
            <Trash size={12} /> Clear All Logs
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800">
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Recipient</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-neutral-400">Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-neutral-400">No email logs found.</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-neutral-800/20 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-neutral-400">
                    {new Date(log.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="block text-[10px] opacity-60">
                      {new Date(log.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-neutral-400 max-w-[160px] truncate">{log.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                    <div className="font-semibold truncate max-w-[180px]">{log.toName || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 truncate max-w-[180px]">{log.to}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-neutral-400 max-w-[200px] truncate">{log.subject}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={log.status} />
                    {log.error && (
                      <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 max-w-[120px] truncate" title={log.error}>{log.error}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-neutral-800">
            <p className="text-xs text-slate-500 dark:text-neutral-400">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1}
                className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                className="px-3 py-1 text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 rounded-lg disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title ?? ''}
        message={confirmModal?.message ?? ''}
        confirmLabel="Delete All"
        variant="danger"
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  )
}

// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    emailService.getStats()
      .then(r => { if (r.success) setStats(r.data) })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!stats) return null

  const successRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Emails', value: stats.total, color: 'text-slate-900 dark:text-white' },
          { label: 'Sent', value: stats.sent, color: 'text-green-600 dark:text-green-400' },
          { label: 'Failed', value: stats.failed, color: 'text-red-600 dark:text-red-400' },
          { label: 'Skipped', value: stats.skipped, color: 'text-slate-500 dark:text-neutral-400' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-black ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Success rate */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Delivery Success Rate</p>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{successRate}%</p>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full transition-all" style={{ width: `${successRate}%` }} />
        </div>
      </div>

      {/* Top email types */}
      {stats.recentByType.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5">
          <p className="text-sm font-bold text-slate-900 dark:text-white mb-4">Top Email Types (Sent)</p>
          <div className="space-y-2">
            {stats.recentByType.map(item => {
              const pct = stats.sent > 0 ? Math.round((item.count / stats.sent) * 100) : 0
              return (
                <div key={item._id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-slate-600 dark:text-neutral-400 truncate">{item._id}</span>
                    <span className="font-bold text-slate-900 dark:text-white ml-2">{item.count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'settings' | 'templates' | 'logs' | 'stats'

const TABS: { id: Tab; label: string }[] = [
  { id: 'settings', label: 'Settings' },
  { id: 'templates', label: 'Templates' },
  { id: 'logs', label: 'Logs' },
  { id: 'stats', label: 'Stats' },
]

export default function AdminEmail() {
  const [tab, setTab] = useState<Tab>('settings')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Envelope size={20} weight="fill" className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-0.5">Email Automation</h2>
          <p className="text-sm text-slate-500 dark:text-neutral-400">Manage automated emails, customize templates, and view delivery logs.</p>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-neutral-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-violet-600 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'logs' && <LogsTab />}
      {tab === 'stats' && <StatsTab />}
    </div>
  )
}
