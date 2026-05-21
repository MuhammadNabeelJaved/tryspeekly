import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ShieldCheck, ShieldWarning, MagnifyingGlass, X, Check } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { siteSettingsService } from '../../services/site-settings.service'

const ALL_COUNTRIES: { code: string; name: string }[] = [
  { code: 'AF', name: 'Afghanistan' }, { code: 'AX', name: 'Åland Islands' },
  { code: 'AL', name: 'Albania' }, { code: 'DZ', name: 'Algeria' },
  { code: 'AS', name: 'American Samoa' }, { code: 'AD', name: 'Andorra' },
  { code: 'AO', name: 'Angola' }, { code: 'AI', name: 'Anguilla' },
  { code: 'AQ', name: 'Antarctica' }, { code: 'AG', name: 'Antigua and Barbuda' },
  { code: 'AR', name: 'Argentina' }, { code: 'AM', name: 'Armenia' },
  { code: 'AW', name: 'Aruba' }, { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' }, { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BS', name: 'Bahamas' }, { code: 'BH', name: 'Bahrain' },
  { code: 'BD', name: 'Bangladesh' }, { code: 'BB', name: 'Barbados' },
  { code: 'BY', name: 'Belarus' }, { code: 'BE', name: 'Belgium' },
  { code: 'BZ', name: 'Belize' }, { code: 'BJ', name: 'Benin' },
  { code: 'BM', name: 'Bermuda' }, { code: 'BT', name: 'Bhutan' },
  { code: 'BO', name: 'Bolivia' }, { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BW', name: 'Botswana' }, { code: 'BV', name: 'Bouvet Island' },
  { code: 'BR', name: 'Brazil' }, { code: 'IO', name: 'British Indian Ocean Territory' },
  { code: 'BN', name: 'Brunei' }, { code: 'BG', name: 'Bulgaria' },
  { code: 'BF', name: 'Burkina Faso' }, { code: 'BI', name: 'Burundi' },
  { code: 'CV', name: 'Cabo Verde' }, { code: 'KH', name: 'Cambodia' },
  { code: 'CM', name: 'Cameroon' }, { code: 'CA', name: 'Canada' },
  { code: 'KY', name: 'Cayman Islands' }, { code: 'CF', name: 'Central African Republic' },
  { code: 'TD', name: 'Chad' }, { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' }, { code: 'CX', name: 'Christmas Island' },
  { code: 'CC', name: 'Cocos Islands' }, { code: 'CO', name: 'Colombia' },
  { code: 'KM', name: 'Comoros' }, { code: 'CG', name: 'Congo' },
  { code: 'CD', name: 'Congo (DRC)' }, { code: 'CK', name: 'Cook Islands' },
  { code: 'CR', name: 'Costa Rica' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'HR', name: 'Croatia' }, { code: 'CU', name: 'Cuba' },
  { code: 'CW', name: 'Curaçao' }, { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czechia' }, { code: 'DK', name: 'Denmark' },
  { code: 'DJ', name: 'Djibouti' }, { code: 'DM', name: 'Dominica' },
  { code: 'DO', name: 'Dominican Republic' }, { code: 'EC', name: 'Ecuador' },
  { code: 'EG', name: 'Egypt' }, { code: 'SV', name: 'El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea' }, { code: 'ER', name: 'Eritrea' },
  { code: 'EE', name: 'Estonia' }, { code: 'SZ', name: 'Eswatini' },
  { code: 'ET', name: 'Ethiopia' }, { code: 'FK', name: 'Falkland Islands' },
  { code: 'FO', name: 'Faroe Islands' }, { code: 'FJ', name: 'Fiji' },
  { code: 'FI', name: 'Finland' }, { code: 'FR', name: 'France' },
  { code: 'GF', name: 'French Guiana' }, { code: 'PF', name: 'French Polynesia' },
  { code: 'GA', name: 'Gabon' }, { code: 'GM', name: 'Gambia' },
  { code: 'GE', name: 'Georgia' }, { code: 'DE', name: 'Germany' },
  { code: 'GH', name: 'Ghana' }, { code: 'GI', name: 'Gibraltar' },
  { code: 'GR', name: 'Greece' }, { code: 'GL', name: 'Greenland' },
  { code: 'GD', name: 'Grenada' }, { code: 'GP', name: 'Guadeloupe' },
  { code: 'GU', name: 'Guam' }, { code: 'GT', name: 'Guatemala' },
  { code: 'GG', name: 'Guernsey' }, { code: 'GN', name: 'Guinea' },
  { code: 'GW', name: 'Guinea-Bissau' }, { code: 'GY', name: 'Guyana' },
  { code: 'HT', name: 'Haiti' }, { code: 'HN', name: 'Honduras' },
  { code: 'HK', name: 'Hong Kong' }, { code: 'HU', name: 'Hungary' },
  { code: 'IS', name: 'Iceland' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' }, { code: 'IE', name: 'Ireland' },
  { code: 'IM', name: 'Isle of Man' }, { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' }, { code: 'JM', name: 'Jamaica' },
  { code: 'JP', name: 'Japan' }, { code: 'JE', name: 'Jersey' },
  { code: 'JO', name: 'Jordan' }, { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' }, { code: 'KI', name: 'Kiribati' },
  { code: 'KP', name: 'North Korea' }, { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' }, { code: 'KG', name: 'Kyrgyzstan' },
  { code: 'LA', name: 'Laos' }, { code: 'LV', name: 'Latvia' },
  { code: 'LB', name: 'Lebanon' }, { code: 'LS', name: 'Lesotho' },
  { code: 'LR', name: 'Liberia' }, { code: 'LY', name: 'Libya' },
  { code: 'LI', name: 'Liechtenstein' }, { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' }, { code: 'MO', name: 'Macao' },
  { code: 'MG', name: 'Madagascar' }, { code: 'MW', name: 'Malawi' },
  { code: 'MY', name: 'Malaysia' }, { code: 'MV', name: 'Maldives' },
  { code: 'ML', name: 'Mali' }, { code: 'MT', name: 'Malta' },
  { code: 'MH', name: 'Marshall Islands' }, { code: 'MQ', name: 'Martinique' },
  { code: 'MR', name: 'Mauritania' }, { code: 'MU', name: 'Mauritius' },
  { code: 'YT', name: 'Mayotte' }, { code: 'MX', name: 'Mexico' },
  { code: 'FM', name: 'Micronesia' }, { code: 'MD', name: 'Moldova' },
  { code: 'MC', name: 'Monaco' }, { code: 'MN', name: 'Mongolia' },
  { code: 'ME', name: 'Montenegro' }, { code: 'MS', name: 'Montserrat' },
  { code: 'MA', name: 'Morocco' }, { code: 'MZ', name: 'Mozambique' },
  { code: 'MM', name: 'Myanmar' }, { code: 'NA', name: 'Namibia' },
  { code: 'NR', name: 'Nauru' }, { code: 'NP', name: 'Nepal' },
  { code: 'NL', name: 'Netherlands' }, { code: 'NC', name: 'New Caledonia' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'NE', name: 'Niger' }, { code: 'NG', name: 'Nigeria' },
  { code: 'NU', name: 'Niue' }, { code: 'NF', name: 'Norfolk Island' },
  { code: 'MK', name: 'North Macedonia' }, { code: 'MP', name: 'Northern Mariana Islands' },
  { code: 'NO', name: 'Norway' }, { code: 'OM', name: 'Oman' },
  { code: 'PK', name: 'Pakistan' }, { code: 'PW', name: 'Palau' },
  { code: 'PS', name: 'Palestine' }, { code: 'PA', name: 'Panama' },
  { code: 'PG', name: 'Papua New Guinea' }, { code: 'PY', name: 'Paraguay' },
  { code: 'PE', name: 'Peru' }, { code: 'PH', name: 'Philippines' },
  { code: 'PN', name: 'Pitcairn' }, { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'QA', name: 'Qatar' }, { code: 'RE', name: 'Réunion' },
  { code: 'RO', name: 'Romania' }, { code: 'RU', name: 'Russia' },
  { code: 'RW', name: 'Rwanda' }, { code: 'BL', name: 'Saint Barthélemy' },
  { code: 'SH', name: 'Saint Helena' }, { code: 'KN', name: 'Saint Kitts and Nevis' },
  { code: 'LC', name: 'Saint Lucia' }, { code: 'MF', name: 'Saint Martin' },
  { code: 'PM', name: 'Saint Pierre and Miquelon' }, { code: 'VC', name: 'Saint Vincent' },
  { code: 'WS', name: 'Samoa' }, { code: 'SM', name: 'San Marino' },
  { code: 'ST', name: 'São Tomé and Príncipe' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SN', name: 'Senegal' }, { code: 'RS', name: 'Serbia' },
  { code: 'SC', name: 'Seychelles' }, { code: 'SL', name: 'Sierra Leone' },
  { code: 'SG', name: 'Singapore' }, { code: 'SX', name: 'Sint Maarten' },
  { code: 'SK', name: 'Slovakia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'SB', name: 'Solomon Islands' }, { code: 'SO', name: 'Somalia' },
  { code: 'ZA', name: 'South Africa' }, { code: 'SS', name: 'South Sudan' },
  { code: 'ES', name: 'Spain' }, { code: 'LK', name: 'Sri Lanka' },
  { code: 'SD', name: 'Sudan' }, { code: 'SR', name: 'Suriname' },
  { code: 'SJ', name: 'Svalbard and Jan Mayen' }, { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' }, { code: 'SY', name: 'Syria' },
  { code: 'TW', name: 'Taiwan' }, { code: 'TJ', name: 'Tajikistan' },
  { code: 'TZ', name: 'Tanzania' }, { code: 'TH', name: 'Thailand' },
  { code: 'TL', name: 'Timor-Leste' }, { code: 'TG', name: 'Togo' },
  { code: 'TK', name: 'Tokelau' }, { code: 'TO', name: 'Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago' }, { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' }, { code: 'TM', name: 'Turkmenistan' },
  { code: 'TC', name: 'Turks and Caicos Islands' }, { code: 'TV', name: 'Tuvalu' },
  { code: 'UG', name: 'Uganda' }, { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' }, { code: 'UM', name: 'US Minor Outlying Islands' },
  { code: 'UY', name: 'Uruguay' }, { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VU', name: 'Vanuatu' }, { code: 'VE', name: 'Venezuela' },
  { code: 'VN', name: 'Vietnam' }, { code: 'VG', name: 'Virgin Islands (British)' },
  { code: 'VI', name: 'Virgin Islands (US)' }, { code: 'WF', name: 'Wallis and Futuna' },
  { code: 'EH', name: 'Western Sahara' }, { code: 'YE', name: 'Yemen' },
  { code: 'ZM', name: 'Zambia' }, { code: 'ZW', name: 'Zimbabwe' },
]

function countryName(code: string) {
  return ALL_COUNTRIES.find(c => c.code === code)?.name || code
}

export default function AdminGeoAccess() {
  const [blocked, setBlocked] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingCode, setSavingCode] = useState<string | null>(null)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    siteSettingsService.getBlockedCountries()
      .then(setBlocked)
      .catch(() => toast.error('Could not load blocked countries.'))
      .finally(() => setLoading(false))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current && !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = ALL_COUNTRIES.filter(c => {
    if (blocked.includes(c.code)) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
  })

  async function handleBlock(code: string, name: string) {
    setSavingCode(code)
    try {
      const updated = await siteSettingsService.blockCountry(code)
      setBlocked(updated)
      setSearch('')
      setShowDropdown(false)
      toast.success(`${name} blocked.`)
    } catch {
      toast.error('Failed to block country.')
    } finally {
      setSavingCode(null)
    }
  }

  async function handleUnblock(code: string) {
    setDeletingCode(code)
    try {
      const updated = await siteSettingsService.unblockCountry(code)
      setBlocked(updated)
      toast.success(`${countryName(code)} unblocked.`)
    } catch {
      toast.error('Failed to unblock country.')
    } finally {
      setDeletingCode(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl">

      {/* Header */}
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
            Pakistan visitors see prices in PKR; all others see USD pricing.
          </p>
        </div>
      </div>

      {/* Block a Country */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 p-5 mb-5">
        <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wide mb-3 flex items-center gap-2">
          <ShieldWarning size={14} className="text-red-500" weight="fill" />
          Block a Country
        </p>

        {/* Search input */}
        <div className="relative">
          <div className="relative">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search country by name or code (e.g. India, IN)…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setShowDropdown(false) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Dropdown list */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                ref={dropdownRef}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl shadow-xl z-30 overflow-hidden"
              >
                {/* Count */}
                <div className="px-4 py-2 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-semibold">
                    {filtered.length} {filtered.length === 1 ? 'country' : 'countries'} available
                  </span>
                  <button onClick={() => setShowDropdown(false)} className="text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 transition-colors">
                    <X size={13} />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-neutral-500">
                      {search ? `No results for "${search}"` : 'All countries are already blocked.'}
                    </div>
                  ) : (
                    filtered.map(c => (
                      <button
                        key={c.code}
                        disabled={savingCode === c.code}
                        onClick={() => handleBlock(c.code, c.name)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 group transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-6 rounded bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-neutral-300 font-mono group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                            {c.code}
                          </span>
                          <span className="text-sm text-slate-700 dark:text-neutral-300 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors">
                            {c.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 dark:text-neutral-600 group-hover:text-red-400 dark:group-hover:text-red-500 transition-colors flex items-center gap-1">
                          {savingCode === c.code
                            ? <span className="animate-pulse">Blocking…</span>
                            : <><ShieldWarning size={11} weight="fill" /> Block</>
                          }
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-2.5 text-[10px] text-slate-400 dark:text-neutral-600">
          Click any country to block it instantly. Already-blocked countries won't appear in this list.
        </p>
      </div>

      {/* Blocked list */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wide flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            </span>
            Blocked Countries
            {!loading && (
              <span className="text-slate-400 dark:text-neutral-500 font-medium normal-case tracking-normal">
                ({blocked.length})
              </span>
            )}
          </p>
          {!loading && blocked.length > 0 && (
            <span className="text-[10px] text-slate-400 dark:text-neutral-600">Click Unblock to restore access</span>
          )}
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-slate-400 dark:text-neutral-500 text-sm">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        ) : blocked.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center mx-auto mb-3">
              <Globe size={26} className="text-emerald-500 dark:text-emerald-400" weight="fill" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-neutral-300">All countries have access</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Use the search above to block a country.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-neutral-800/50">
            <AnimatePresence initial={false}>
              {blocked.map(code => (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-black text-red-600 dark:text-red-400 font-mono">{code}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{countryName(code)}</p>
                      <p className="text-[10px] text-red-500 dark:text-red-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        Access blocked
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(code)}
                    disabled={deletingCode === code}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-neutral-700 text-slate-500 dark:text-neutral-400 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all disabled:opacity-50"
                  >
                    {deletingCode === code
                      ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Check size={12} weight="bold" />
                    }
                    {deletingCode === code ? 'Unblocking…' : 'Unblock'}
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
