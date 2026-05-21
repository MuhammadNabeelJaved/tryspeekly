import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash, Globe, ShieldCheck, ShieldWarning, X } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { siteSettingsService } from '../../services/site-settings.service'

// ISO 3166-1 alpha-2 — common countries with names
const COUNTRY_NAMES: Record<string, string> = {
  AF: 'Afghanistan', AL: 'Albania', DZ: 'Algeria', AR: 'Argentina', AU: 'Australia',
  AT: 'Austria', BD: 'Bangladesh', BE: 'Belgium', BR: 'Brazil', CA: 'Canada',
  CN: 'China', CO: 'Colombia', CD: 'Congo', EG: 'Egypt', ET: 'Ethiopia',
  FR: 'France', DE: 'Germany', GH: 'Ghana', GR: 'Greece', IN: 'India',
  ID: 'Indonesia', IR: 'Iran', IQ: 'Iraq', IE: 'Ireland', IL: 'Israel',
  IT: 'Italy', JP: 'Japan', JO: 'Jordan', KE: 'Kenya', KW: 'Kuwait',
  LB: 'Lebanon', LY: 'Libya', MY: 'Malaysia', MX: 'Mexico', MA: 'Morocco',
  MM: 'Myanmar', NP: 'Nepal', NL: 'Netherlands', NG: 'Nigeria', NO: 'Norway',
  OM: 'Oman', PK: 'Pakistan', PH: 'Philippines', PL: 'Poland', PT: 'Portugal',
  QA: 'Qatar', RO: 'Romania', RU: 'Russia', SA: 'Saudi Arabia', SN: 'Senegal',
  ZA: 'South Africa', ES: 'Spain', LK: 'Sri Lanka', SE: 'Sweden', CH: 'Switzerland',
  SY: 'Syria', TZ: 'Tanzania', TH: 'Thailand', TN: 'Tunisia', TR: 'Turkey',
  UA: 'Ukraine', AE: 'United Arab Emirates', GB: 'United Kingdom', US: 'United States',
  UZ: 'Uzbekistan', VN: 'Vietnam', YE: 'Yemen', ZM: 'Zambia', ZW: 'Zimbabwe',
}

function countryName(code: string) {
  return COUNTRY_NAMES[code] || code
}

export default function AdminGeoAccess() {
  const [blocked, setBlocked] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)

  useEffect(() => {
    siteSettingsService.getBlockedCountries()
      .then(setBlocked)
      .catch(() => toast.error('Could not load blocked countries.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleBlock() {
    const code = newCode.trim().toUpperCase()
    if (code.length !== 2) {
      toast.error('Enter a valid 2-letter country code (e.g. IN, US, GB).')
      return
    }
    if (blocked.includes(code)) {
      toast.error(`${countryName(code)} is already blocked.`)
      return
    }
    setSaving(true)
    try {
      const updated = await siteSettingsService.blockCountry(code)
      setBlocked(updated)
      setNewCode('')
      toast.success(`${countryName(code)} (${code}) blocked.`)
    } catch {
      toast.error('Failed to block country.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUnblock(code: string) {
    setDeletingCode(code)
    try {
      const updated = await siteSettingsService.unblockCountry(code)
      setBlocked(updated)
      toast.success(`${countryName(code)} (${code}) unblocked.`)
    } catch {
      toast.error('Failed to unblock country.')
    } finally {
      setDeletingCode(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Globe size={20} className="text-violet-600" weight="fill" />
          Geo Access Control
        </h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
          Block or allow specific countries from accessing the platform. Changes take effect in real-time.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
        <ShieldCheck size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" weight="fill" />
        <div>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-300">How it works</p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-0.5 leading-relaxed">
            Blocked countries see a "Not available in your region" page. India is blocked by default.
            Pakistan users see prices in PKR; all others see USD pricing.
          </p>
        </div>
      </div>

      {/* Add country */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-5 mb-5">
        <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wide mb-3">Block a Country</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase().slice(0, 2))}
              onKeyDown={e => e.key === 'Enter' && handleBlock()}
              placeholder="Country code (e.g. IN, RU)"
              maxLength={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors font-mono uppercase"
            />
            {newCode.length === 2 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-neutral-500">
                {countryName(newCode)}
              </span>
            )}
          </div>
          <button
            onClick={handleBlock}
            disabled={saving || newCode.length !== 2}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
          >
            <ShieldWarning size={15} weight="bold" />
            {saving ? 'Blocking…' : 'Block Country'}
          </button>
        </div>

        {/* Quick-select common countries */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['IN', 'RU', 'CN', 'IR', 'IQ'].filter(c => !blocked.includes(c)).map(code => (
            <button
              key={code}
              onClick={() => setNewCode(code)}
              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-[10px] font-bold text-slate-500 dark:text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {code} — {countryName(code)}
            </button>
          ))}
        </div>
      </div>

      {/* Blocked list */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wide">
            Blocked Countries
            {!loading && <span className="ml-2 text-slate-400 font-medium normal-case">({blocked.length})</span>}
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 dark:text-neutral-500 text-sm">Loading…</div>
        ) : blocked.length === 0 ? (
          <div className="p-8 text-center">
            <Globe size={32} className="mx-auto mb-2 text-slate-300 dark:text-neutral-700" />
            <p className="text-sm text-slate-400 dark:text-neutral-500">No countries blocked. All regions have access.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
            <AnimatePresence>
              {blocked.map(code => (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-xs font-black text-red-600 dark:text-red-400 font-mono">
                      {code}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{countryName(code)}</p>
                      <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold">Access blocked</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(code)}
                    disabled={deletingCode === code}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors disabled:opacity-50"
                  >
                    {deletingCode === code ? <X size={13} className="animate-spin" /> : <Plus size={13} weight="bold" className="rotate-45" />}
                    Unblock
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
