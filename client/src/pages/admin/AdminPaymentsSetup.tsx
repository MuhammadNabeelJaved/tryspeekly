import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash, PencilSimple, X, Check, Star, FloppyDisk,
  CheckCircle, ArrowCounterClockwise, CaretDown, CaretUp,
  Globe, Phone as PhoneIcon, ShieldCheck, CreditCard,
} from '@phosphor-icons/react'
import type { PaymentMethodAdmin, PaymentPolicyAdmin, PaymentFaqAdmin } from './adminData'
import { INITIAL_PAYMENTS_SETUP } from './adminData'
import { siteSettingsService } from '@/services/site-settings.service'
import toast from 'react-hot-toast'

// ─── HELPERS ─────────────────────────────────────────────────────────────────

type Section =
  | 'local-methods'
  | 'intl-methods'
  | 'hero'
  | 'steps'
  | 'security'
  | 'policies'
  | 'faq'
  | 'footer'

const LOGO_KEYS = [
  { key: 'easypaisa', label: 'Easypaisa' },
  { key: 'jazzcash', label: 'JazzCash' },
  { key: 'sadapay', label: 'SadaPay' },
  { key: 'nayapay', label: 'NayaPay' },
  { key: 'nsave', label: 'NSave' },
  { key: 'bank-local', label: 'Local Bank Icon' },
  { key: 'bank-intl', label: 'International Bank Icon' },
  { key: 'custom', label: 'Custom URL' },
]

const EMPTY_METHOD: PaymentMethodAdmin = {
  id: '', tab: 'local', name: '', tagline: '', description: '',
  features: ['', '', '', ''], logoKey: 'easypaisa', logoUrl: '',
  fallbackBg: '#6366f1', accentColor: '#6366f1', recommended: false,
  processingTime: 'Instant', buttonText: '', accountTitle: 'EnglishPro Academy',
  accountIban: '', bankName: '', reference: 'Your Full Name',
  whatsappLink: 'https://wa.me/923086925545', receiptEmail: 'payments@englishpro.com',
}

const EMPTY_POLICY: PaymentPolicyAdmin = {
  id: '', title: '', color: '#8B5CF6', points: ['', '', '', '', ''],
}

const EMPTY_FAQ: PaymentFaqAdmin = { id: '', question: '', answer: '' }

// ─── FIELD COMPONENTS ─────────────────────────────────────────────────────────

function Inp({ label, value, onChange, type = 'text', placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; hint?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">{label}</label>
      {hint && <p className="text-[10px] text-slate-400 dark:text-neutral-600 mb-1">{hint}</p>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
      />
    </div>
  )
}

function Txta({ label, value, onChange, rows = 2, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none"
      />
    </div>
  )
}

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex justify-end mt-5 pt-4 border-t border-slate-100 dark:border-neutral-800">
      <button onClick={onSave} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]'}`}>
        {saved ? <><CheckCircle size={14} weight="fill" />Saved!</> : <><FloppyDisk size={14} weight="fill" />Save Changes</>}
      </button>
    </div>
  )
}

// ─── METHOD MODAL ─────────────────────────────────────────────────────────────

function MethodModal({ method, onSave, onClose }: {
  method: PaymentMethodAdmin
  onSave: (m: PaymentMethodAdmin) => void
  onClose: () => void
}) {
  const { watch, setValue, handleSubmit } = useForm<PaymentMethodAdmin>({
    defaultValues: method
  })
  const [tab, setTab] = useState<'basic' | 'design' | 'features' | 'account'>('basic')

  const form = watch()

  function f(key: keyof PaymentMethodAdmin) {
    return (v: string) => setValue(key, v as any)
  }

  function updateFeature(idx: number, v: string) {
    const features = [...form.features]
    features[idx] = v
    setValue('features', features)
  }

  function addFeature() { setValue('features', [...form.features, '']) }
  function removeFeature(idx: number) { setValue('features', form.features.filter((_, i) => i !== idx)) }

  const TABS = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'design', label: 'Logo & Design' },
    { key: 'features', label: 'Features' },
    { key: 'account', label: 'Account Details' },
  ] as const

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-100 dark:border-neutral-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{form.id ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
            <p className="text-[11px] text-slate-400 dark:text-neutral-600 mt-0.5">{form.tab === 'local' ? 'Local (Pakistani)' : 'International'} method</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"><X size={15} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-neutral-800 flex-shrink-0 px-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 -mb-px ${tab === t.key ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400' : 'border-transparent text-slate-400 dark:text-neutral-600 hover:text-slate-600 dark:hover:text-neutral-400'}`}
            >{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">

          {/* ── BASIC INFO ── */}
          {tab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Inp label="Method Name" value={form.name} onChange={f('name')} placeholder="Easypaisa" />
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">Tab</label>
                  <select value={form.tab} onChange={e => setValue('tab', e.target.value as 'local' | 'international')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                  >
                    <option value="local">Local (Pakistani)</option>
                    <option value="international">International</option>
                  </select>
                </div>
              </div>
              <Inp label="Tagline" value={form.tagline} onChange={f('tagline')} placeholder="Pakistan's #1 Mobile Wallet" />
              <Txta label="Description (shown in detail panel)" value={form.description} onChange={f('description')} rows={2} placeholder="Pay instantly using your Easypaisa mobile account..." />
              <div className="grid grid-cols-2 gap-4">
                <Inp label="Processing Time" value={form.processingTime} onChange={f('processingTime')} placeholder="Instant" />
                <Inp label="Button Text" value={form.buttonText} onChange={f('buttonText')} placeholder="Pay with Easypaisa" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900">
                <input type="checkbox" id="recommended" checked={form.recommended} onChange={e => setValue('recommended', e.target.checked)}
                  className="w-4 h-4 rounded accent-violet-600"
                />
                <label htmlFor="recommended" className="text-sm font-semibold text-violet-700 dark:text-violet-400 cursor-pointer flex items-center gap-2">
                  <Star size={14} weight="fill" className="text-violet-500" />Show "Recommended" badge on this method
                </label>
              </div>
            </div>
          )}

          {/* ── LOGO & DESIGN ── */}
          {tab === 'design' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">Logo</label>
                <select value={form.logoKey} onChange={e => setValue('logoKey', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors mb-3"
                >
                  {LOGO_KEYS.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
                {form.logoKey === 'custom' && (
                  <Inp label="Custom Logo URL" value={form.logoUrl} onChange={f('logoUrl')} type="url" placeholder="https://example.com/logo.png" />
                )}
                {form.logoKey !== 'custom' && (
                  <p className="text-[11px] text-slate-400 dark:text-neutral-600">Using built-in logo from Google Play Store. Select "Custom URL" to use your own image.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">Fallback Background</label>
                  <p className="text-[10px] text-slate-400 mb-1.5">Shown if logo fails to load</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.fallbackBg} onChange={e => setValue('fallbackBg', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-neutral-700 cursor-pointer" />
                    <input type="text" value={form.fallbackBg} onChange={e => setValue('fallbackBg', e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">Accent Color</label>
                  <p className="text-[10px] text-slate-400 mb-1.5">Used for hover effects & highlights</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.accentColor} onChange={e => setValue('accentColor', e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-neutral-700 cursor-pointer" />
                    <input type="text" value={form.accentColor} onChange={e => setValue('accentColor', e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-800/60 rounded-xl border border-slate-200 dark:border-neutral-700">
                <p className="text-[10px] text-slate-400 dark:text-neutral-600 font-semibold uppercase tracking-wide mb-2">Color Preview</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: form.fallbackBg }} />
                  <div>
                    <div className="w-24 h-2 rounded-full mb-1.5" style={{ backgroundColor: form.accentColor, opacity: 0.8 }} />
                    <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: form.accentColor, opacity: 0.4 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURES ── */}
          {tab === 'features' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 dark:text-neutral-600">List the key features shown on the payment method card (2–6 items recommended).</p>
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center flex-shrink-0">
                    <Check size={10} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <input value={feat} onChange={e => updateFeature(idx, e.target.value)} placeholder={`Feature ${idx + 1}`}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                  />
                  <button onClick={() => removeFeature(idx)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors">
                    <Trash size={13} />
                  </button>
                </div>
              ))}
              <button onClick={addFeature} className="flex items-center gap-2 w-full py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-neutral-700 text-slate-400 hover:border-violet-400 hover:text-violet-500 text-xs font-semibold transition-colors">
                <Plus size={13} />Add Feature
              </button>
            </div>
          )}

          {/* ── ACCOUNT DETAILS ── */}
          {tab === 'account' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 dark:text-neutral-600">These details appear in the right-side panel when a student selects this payment method.</p>
              <Inp label="Account Title" value={form.accountTitle} onChange={f('accountTitle')} placeholder="EnglishPro Academy" />
              <Inp label="Account Number / IBAN" value={form.accountIban} onChange={f('accountIban')} placeholder="PK36 MEZN 0001 2345 0100 6543" />
              <Inp label="Bank / App Name" value={form.bankName} onChange={f('bankName')} placeholder="Meezan Bank Ltd." />
              <Inp label="Reference Field Label" value={form.reference} onChange={f('reference')} placeholder="Your Full Name" hint="What to include as payment reference/narration" />
              <div className="grid grid-cols-2 gap-4">
                <Inp label="WhatsApp Link (for receipt)" value={form.whatsappLink} onChange={f('whatsappLink')} type="url" placeholder="https://wa.me/92..." />
                <Inp label="Email (for receipt)" value={form.receiptEmail} onChange={f('receiptEmail')} type="email" placeholder="payments@englishpro.com" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-neutral-800 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
          <button onClick={handleSubmit(onSave)} className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
            <Check size={15} weight="bold" />Save Method
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminPaymentsSetup() {
  const [data, setData] = useState(INITIAL_PAYMENTS_SETUP)
  const [activeSection, setActiveSection] = useState<Section>('local-methods')
  const [saved, setSaved] = useState(false)
  const [methodModal, setMethodModal] = useState<PaymentMethodAdmin | null>(null)
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null)
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const settings = await siteSettingsService.get()
        if (settings.paymentsSetup && Object.keys(settings.paymentsSetup).length > 0) {
          setData(settings.paymentsSetup as unknown as typeof INITIAL_PAYMENTS_SETUP)
        }
      } catch { /* silent */ }
    }
    load()
  }, [])

  async function save() {
    try {
      await siteSettingsService.update({ paymentsSetup: data as unknown as Record<string, unknown> })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Payment settings saved')
    } catch {
      toast.error('Failed to save settings')
    }
  }

  async function resetAll() {
    setData(INITIAL_PAYMENTS_SETUP)
    try {
      await siteSettingsService.update({ paymentsSetup: INITIAL_PAYMENTS_SETUP as unknown as Record<string, unknown> })
      toast.success('Reset to defaults')
    } catch {
      toast.error('Failed to reset')
    }
  }

  function upd(path: string[], value: unknown) {
    setData((prev: typeof INITIAL_PAYMENTS_SETUP) => {
      const next = JSON.parse(JSON.stringify(prev))
      let obj: Record<string, unknown> = next
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]] as Record<string, unknown>
      obj[path[path.length - 1]] = value
      return next
    })
  }

  // Methods
  const localMethods: PaymentMethodAdmin[] = data.methods.filter((m: PaymentMethodAdmin) => m.tab === 'local')
  const intlMethods: PaymentMethodAdmin[] = data.methods.filter((m: PaymentMethodAdmin) => m.tab === 'international')

  function saveMethod(method: PaymentMethodAdmin) {
    if (!method.id) {
      setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, methods: [...p.methods, { ...method, id: `pm${Date.now()}` }] }))
    } else {
      setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, methods: p.methods.map((m: PaymentMethodAdmin) => m.id === method.id ? method : m) }))
    }
    setMethodModal(null)
  }

  function deleteMethod(id: string) {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, methods: p.methods.filter((m: PaymentMethodAdmin) => m.id !== id) }))
    setDeleteMethodId(null)
  }

  function moveMethod(id: string, dir: -1 | 1) {
    const methods = [...data.methods]
    const idx = methods.findIndex((m: PaymentMethodAdmin) => m.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= methods.length) return
    ;[methods[idx], methods[swapIdx]] = [methods[swapIdx], methods[idx]]
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, methods }))
  }

  // Policies
  function updatePolicy(id: string, key: keyof PaymentPolicyAdmin, value: unknown) {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({
      ...p,
      policies: p.policies.map((pol: PaymentPolicyAdmin) => pol.id === id ? { ...pol, [key]: value } : pol),
    }))
  }

  function updatePolicyPoint(policyId: string, idx: number, value: string) {
    const policy = data.policies.find((p: PaymentPolicyAdmin) => p.id === policyId)
    if (!policy) return
    const points = [...policy.points]
    points[idx] = value
    updatePolicy(policyId, 'points', points)
  }

  function addPolicyPoint(policyId: string) {
    const policy = data.policies.find((p: PaymentPolicyAdmin) => p.id === policyId)
    if (!policy) return
    updatePolicy(policyId, 'points', [...policy.points, ''])
  }

  function removePolicyPoint(policyId: string, idx: number) {
    const policy = data.policies.find((p: PaymentPolicyAdmin) => p.id === policyId)
    if (!policy) return
    updatePolicy(policyId, 'points', policy.points.filter((_: string, i: number) => i !== idx))
  }

  function addPolicy() {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({
      ...p,
      policies: [...p.policies, { ...EMPTY_POLICY, id: `pol${Date.now()}` }],
    }))
  }

  function deletePolicy(id: string) {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, policies: p.policies.filter((pol: PaymentPolicyAdmin) => pol.id !== id) }))
  }

  // FAQs
  function updateFaq(id: string, key: keyof PaymentFaqAdmin, value: string) {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({
      ...p,
      faqs: p.faqs.map((fq: PaymentFaqAdmin) => fq.id === id ? { ...fq, [key]: value } : fq),
    }))
  }

  function addFaq() {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({
      ...p,
      faqs: [...p.faqs, { ...EMPTY_FAQ, id: `fq${Date.now()}` }],
    }))
  }

  function deleteFaq(id: string) {
    setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, faqs: p.faqs.filter((fq: PaymentFaqAdmin) => fq.id !== id) }))
  }

  const SECTIONS: { key: Section; label: string; icon: React.ReactNode }[] = [
    { key: 'local-methods', label: 'Local Methods', icon: <PhoneIcon size={14} /> },
    { key: 'intl-methods', label: 'Intl. Methods', icon: <Globe size={14} /> },
    { key: 'hero', label: 'Page Hero', icon: <Star size={14} /> },
    { key: 'steps', label: 'How It Works', icon: <CheckCircle size={14} /> },
    { key: 'security', label: 'Security Banner', icon: <ShieldCheck size={14} /> },
    { key: 'policies', label: 'Policies', icon: <CreditCard size={14} /> },
    { key: 'faq', label: 'FAQ & Footer', icon: <PencilSimple size={14} /> },
  ]

  function MethodCard({ method }: { method: PaymentMethodAdmin }) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 transition-all group">
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ backgroundColor: method.fallbackBg }}>
                <div className="w-full h-full rounded-xl flex items-center justify-center text-white text-xs font-bold">
                  {method.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate">{method.name}</span>
                  {method.recommended && (
                    <span className="px-1.5 py-0.5 bg-violet-600 text-white text-[9px] font-bold rounded-full flex items-center gap-0.5 flex-shrink-0">
                      <Star size={8} weight="fill" />Rec.
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 dark:text-neutral-600 truncate">{method.tagline}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1 mb-3">
            {method.features.slice(0, 3).map((f, i) => (
              <p key={i} className="text-[10px] text-slate-500 dark:text-neutral-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />{f}
              </p>
            ))}
            {method.features.length > 3 && <p className="text-[10px] text-slate-400 dark:text-neutral-600">+{method.features.length - 3} more</p>}
          </div>

          <div className="flex items-center gap-1.5 mb-3">
            <div className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: method.accentColor + '30' }} />
            <span className="text-[10px] text-slate-400 dark:text-neutral-600 font-medium">{method.processingTime}</span>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-neutral-600 truncate">{method.accountIban || 'No IBAN set'}</div>
        </div>

        <div className="flex border-t border-slate-100 dark:border-neutral-800">
          <button onClick={() => moveMethod(method.id, -1)} className="flex-none px-2.5 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors text-xs"><CaretUp size={12} /></button>
          <button onClick={() => moveMethod(method.id, 1)} className="flex-none px-2.5 py-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-neutral-800/50 border-r border-slate-100 dark:border-neutral-800 transition-colors text-xs"><CaretDown size={12} /></button>
          <button onClick={() => setMethodModal({ ...method })} className="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1 transition-colors">
            <PencilSimple size={12} />Edit
          </button>
          <div className="w-px bg-slate-100 dark:bg-neutral-800" />
          <button onClick={() => setDeleteMethodId(method.id)} className="flex-1 py-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-center gap-1 transition-colors">
            <Trash size={12} />Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">

      {/* ── LEFT SIDEBAR ── */}
      <aside className="w-52 flex-shrink-0 bg-white dark:bg-neutral-900 border-r border-slate-100 dark:border-neutral-800 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-neutral-800">
          <p className="text-[10px] font-black text-slate-400 dark:text-neutral-600 uppercase tracking-widest">Payments Page</p>
        </div>
        <nav className="flex-1 py-2">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold transition-colors ${activeSection === s.key ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400' : 'text-slate-500 dark:text-neutral-500 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-700 dark:hover:text-neutral-300'}`}
            >
              <span className={activeSection === s.key ? 'text-violet-500' : 'text-slate-300 dark:text-neutral-700'}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 dark:border-neutral-800 space-y-2">
          <button onClick={save} className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
            {saved ? <><CheckCircle size={12} weight="fill" />Saved!</> : <><FloppyDisk size={12} weight="fill" />Save All</>}
          </button>
          <button onClick={resetAll} className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
            <ArrowCounterClockwise size={11} />Reset to Defaults
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto p-5 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

            {/* ── LOCAL METHODS ── */}
            {(activeSection === 'local-methods' || activeSection === 'intl-methods') && (() => {
              const isLocal = activeSection === 'local-methods'
              const methods = isLocal ? localMethods : intlMethods
              const tabVal = isLocal ? 'local' : 'international'
              return (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{isLocal ? 'Local (Pakistani)' : 'International'} Payment Methods</h3>
                      <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{methods.length} method{methods.length !== 1 ? 's' : ''} configured</p>
                    </div>
                    <button
                      onClick={() => setMethodModal({ ...EMPTY_METHOD, id: '', tab: tabVal })}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors"
                    >
                      <Plus size={14} weight="bold" />Add Method
                    </button>
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {methods.map(m => <MethodCard key={m.id} method={m} />)}
                    <button onClick={() => setMethodModal({ ...EMPTY_METHOD, id: '', tab: tabVal })}
                      className="border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-300 dark:text-neutral-700 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-400 transition-all min-h-[180px]"
                    >
                      <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center">
                        <Plus size={18} />
                      </div>
                      <p className="text-xs font-semibold">Add Method</p>
                    </button>
                  </div>
                  <SaveBar onSave={save} saved={saved} />
                </div>
              )
            })()}

            {/* ── HERO ── */}
            {activeSection === 'hero' && (
              <div className="max-w-2xl space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">Page Hero & Navigation Labels</h3>
                <Inp label="Hero Badge Text" value={data.hero.badge} onChange={v => upd(['hero', 'badge'], v)} placeholder="Simple & Secure Payments" />
                <Inp label="Page Title" value={data.hero.title} onChange={v => upd(['hero', 'title'], v)} placeholder="Flexible Payment Options" />
                <Txta label="Page Subtitle" value={data.hero.subtitle} onChange={v => upd(['hero', 'subtitle'], v)} rows={2} />

                <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
                  <h4 className="text-xs font-black text-slate-700 dark:text-neutral-300 mb-3">Trust Badges (4 items)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {data.trustBadges.map((b: { id: string; label: string }, i: number) => (
                      <Inp key={b.id} label={`Badge ${i + 1}`} value={b.label} onChange={v => {
                        const badges = [...data.trustBadges]
                        badges[i] = { ...b, label: v }
                        upd(['trustBadges'], badges)
                      }} />
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
                  <h4 className="text-xs font-black text-slate-700 dark:text-neutral-300 mb-3">Tab Labels</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Inp label="Local Tab Label" value={data.tabs.localLabel} onChange={v => upd(['tabs', 'localLabel'], v)} placeholder="Local Payments" />
                    <Inp label="International Tab Label" value={data.tabs.intlLabel} onChange={v => upd(['tabs', 'intlLabel'], v)} placeholder="International" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
                  <h4 className="text-xs font-black text-slate-700 dark:text-neutral-300 mb-3">Section Labels</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Inp label="Local Section Label" value={data.sectionLabels.local} onChange={v => upd(['sectionLabels', 'local'], v)} placeholder="Pakistani Payment Methods" />
                    <Inp label="International Section Label" value={data.sectionLabels.intl} onChange={v => upd(['sectionLabels', 'intl'], v)} placeholder="International Payment Methods" />
                  </div>
                </div>
                <SaveBar onSave={save} saved={saved} />
              </div>
            )}

            {/* ── STEPS ── */}
            {activeSection === 'steps' && (
              <div className="max-w-2xl space-y-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white">How It Works Section</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Section Badge" value={data.stepsSection.badge} onChange={v => upd(['stepsSection', 'badge'], v)} />
                  <Inp label="Section Title" value={data.stepsSection.title} onChange={v => upd(['stepsSection', 'title'], v)} />
                </div>
                <Inp label="Section Subtitle" value={data.stepsSection.subtitle} onChange={v => upd(['stepsSection', 'subtitle'], v)} />

                <div className="border-t border-slate-100 dark:border-neutral-800 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-neutral-300">Steps</h4>
                    <button onClick={() => setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, steps: [...p.steps, { id: `st${Date.now()}`, number: String(p.steps.length + 1).padStart(2, '0'), title: '', description: '' }] }))}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-xs font-bold hover:bg-violet-100 transition-colors"
                    ><Plus size={12} />Add Step</button>
                  </div>
                  <div className="space-y-4">
                    {data.steps.map((step: { id: string; number: string; title: string; description: string }, idx: number) => (
                      <div key={step.id} className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white text-xs font-black">{step.number}</div>
                          <button onClick={() => setData((p: typeof INITIAL_PAYMENTS_SETUP) => ({ ...p, steps: p.steps.filter((_: { id: string }, i: number) => i !== idx) }))}
                            className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"
                          ><Trash size={12} /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <Inp label="Number" value={step.number} onChange={v => { const s = [...data.steps]; s[idx] = { ...s[idx], number: v }; upd(['steps'], s) }} />
                          <div className="col-span-2"><Inp label="Title" value={step.title} onChange={v => { const s = [...data.steps]; s[idx] = { ...s[idx], title: v }; upd(['steps'], s) }} /></div>
                        </div>
                        <div className="mt-3"><Txta label="Description" value={step.description} onChange={v => { const s = [...data.steps]; s[idx] = { ...s[idx], description: v }; upd(['steps'], s) }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                <SaveBar onSave={save} saved={saved} />
              </div>
            )}

            {/* ── SECURITY BANNER ── */}
            {activeSection === 'security' && (
              <div className="max-w-2xl space-y-4">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Security Banner Items</h3>
                <p className="text-xs text-slate-400 dark:text-neutral-600">The 4-item security banner shown below the payment methods.</p>
                {data.securityBanner.map((item: { id: string; title: string; description: string }, idx: number) => (
                  <div key={item.id} className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl p-4 border border-slate-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-white/20 dark:bg-white/5 flex items-center justify-center">
                        <ShieldCheck size={13} className="text-violet-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-600 dark:text-neutral-400">Item {idx + 1}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Inp label="Title" value={item.title} onChange={v => { const s = [...data.securityBanner]; s[idx] = { ...s[idx], title: v }; upd(['securityBanner'], s) }} />
                      <Inp label="Description" value={item.description} onChange={v => { const s = [...data.securityBanner]; s[idx] = { ...s[idx], description: v }; upd(['securityBanner'], s) }} />
                    </div>
                  </div>
                ))}
                <SaveBar onSave={save} saved={saved} />
              </div>
            )}

            {/* ── POLICIES ── */}
            {activeSection === 'policies' && (
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Payment Policies</h3>
                  <button onClick={addPolicy} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
                    <Plus size={14} weight="bold" />Add Policy
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Inp label="Section Badge" value={data.policiesSection.badge} onChange={v => upd(['policiesSection', 'badge'], v)} />
                  <Inp label="Section Title" value={data.policiesSection.title} onChange={v => upd(['policiesSection', 'title'], v)} />
                </div>
                <Txta label="Section Subtitle" value={data.policiesSection.subtitle} onChange={v => upd(['policiesSection', 'subtitle'], v)} />
                <div className="grid grid-cols-2 gap-3">
                  <Txta label="Footer Note" value={data.policiesSection.note} onChange={v => upd(['policiesSection', 'note'], v)} />
                  <Inp label="Footer Email" value={data.policiesSection.noteEmail} onChange={v => upd(['policiesSection', 'noteEmail'], v)} type="email" />
                </div>

                <div className="space-y-3 border-t border-slate-100 dark:border-neutral-800 pt-4">
                  {data.policies.map((policy: PaymentPolicyAdmin) => {
                    const isOpen = expandedPolicy === policy.id
                    return (
                      <div key={policy.id} className="rounded-2xl border-2 overflow-hidden transition-all" style={{ borderColor: isOpen ? policy.color + '60' : '' }}>
                        <div className={`flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-neutral-800/60 ${!isOpen ? 'border-b-0' : 'border-b border-slate-100 dark:border-neutral-800'}`}>
                          <button onClick={() => setExpandedPolicy(isOpen ? null : policy.id)} className="flex-1 flex items-center gap-3 text-left">
                            {isOpen ? <CaretDown size={13} className="text-violet-500" /> : <CaretDown size={13} className="text-slate-400 -rotate-90" />}
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{policy.title || 'Untitled Policy'}</span>
                            <span className="text-[10px] text-slate-400 dark:text-neutral-600">{policy.points.length} points</span>
                          </button>
                          <button onClick={() => deletePolicy(policy.id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors flex-shrink-0"><Trash size={12} /></button>
                        </div>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                              <div className="p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <Inp label="Policy Title" value={policy.title} onChange={v => updatePolicy(policy.id, 'title', v)} />
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-1">Accent Color</label>
                                    <div className="flex items-center gap-2">
                                      <input type="color" value={policy.color} onChange={e => updatePolicy(policy.id, 'color', e.target.value)} className="w-9 h-9 rounded-lg border border-slate-200 dark:border-neutral-700 cursor-pointer" />
                                      <input type="text" value={policy.color} onChange={e => updatePolicy(policy.id, 'color', e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors" />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[11px] font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wide block mb-2">Policy Points</label>
                                  <div className="space-y-2">
                                    {policy.points.map((pt: string, pidx: number) => (
                                      <div key={pidx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: policy.color }} />
                                        <input value={pt} onChange={e => updatePolicyPoint(policy.id, pidx, e.target.value)} placeholder={`Point ${pidx + 1}`}
                                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                                        />
                                        <button onClick={() => removePolicyPoint(policy.id, pidx)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors"><Trash size={11} /></button>
                                      </div>
                                    ))}
                                    <button onClick={() => addPolicyPoint(policy.id)} className="flex items-center gap-2 w-full py-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 text-slate-400 hover:border-violet-400 hover:text-violet-500 text-xs font-semibold transition-colors">
                                      <Plus size={12} />Add Point
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
                <SaveBar onSave={save} saved={saved} />
              </div>
            )}

            {/* ── FAQ & FOOTER ── */}
            {activeSection === 'faq' && (
              <div className="max-w-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">FAQ & Footer</h3>
                  <button onClick={addFaq} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition-colors">
                    <Plus size={14} weight="bold" />Add FAQ
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Inp label="FAQ Section Badge" value={data.faqSection.badge} onChange={v => upd(['faqSection', 'badge'], v)} />
                  <Inp label="FAQ Section Title" value={data.faqSection.title} onChange={v => upd(['faqSection', 'title'], v)} />
                </div>

                <div className="space-y-3">
                  {data.faqs.map((faq: PaymentFaqAdmin, idx: number) => {
                    const isOpen = expandedFaq === faq.id
                    return (
                      <div key={faq.id} className="rounded-2xl border border-slate-200 dark:border-neutral-700 overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 dark:bg-neutral-800/60">
                          <button onClick={() => setExpandedFaq(isOpen ? null : faq.id)} className="flex-1 flex items-center gap-2 text-left">
                            {isOpen ? <CaretDown size={12} className="text-violet-500" /> : <CaretDown size={12} className="text-slate-400 -rotate-90" />}
                            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 truncate">{faq.question || `FAQ ${idx + 1}`}</span>
                          </button>
                          <button onClick={() => deleteFaq(faq.id)} className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors flex-shrink-0"><Trash size={11} /></button>
                        </div>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                              <div className="p-4 space-y-3 border-t border-slate-100 dark:border-neutral-800">
                                <Inp label="Question" value={faq.question} onChange={v => updateFaq(faq.id, 'question', v)} />
                                <Txta label="Answer" value={faq.answer} onChange={v => updateFaq(faq.id, 'answer', v)} rows={3} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-800 pt-5 space-y-3">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Footer Section</h4>
                  <Inp label="Footer Message" value={data.footer.message} onChange={v => upd(['footer', 'message'], v)} placeholder="Have questions about payment? We're here to help." />
                  <div className="grid grid-cols-2 gap-3">
                    <Inp label="Primary CTA Text" value={data.footer.ctaText} onChange={v => upd(['footer', 'ctaText'], v)} placeholder="Contact Support" />
                    <Inp label="Primary CTA Link" value={data.footer.ctaLink} onChange={v => upd(['footer', 'ctaLink'], v)} type="url" placeholder="/contact" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Inp label="WhatsApp Button Text" value={data.footer.whatsappText} onChange={v => upd(['footer', 'whatsappText'], v)} placeholder="WhatsApp Us" />
                    <Inp label="WhatsApp Link" value={data.footer.whatsappLink} onChange={v => upd(['footer', 'whatsappLink'], v)} type="url" placeholder="https://wa.me/92..." />
                  </div>
                </div>
                <SaveBar onSave={save} saved={saved} />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── METHOD MODAL ── */}
      <AnimatePresence>
        {methodModal && (
          <MethodModal
            method={methodModal}
            onSave={saveMethod}
            onClose={() => setMethodModal(null)}
          />
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteMethodId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4"><Trash size={22} className="text-red-500" /></div>
              <h3 className="font-black text-slate-900 dark:text-white mb-1">Delete Method?</h3>
              <p className="text-sm text-slate-400 dark:text-neutral-500 mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteMethodId(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                <button onClick={() => deleteMethod(deleteMethodId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
