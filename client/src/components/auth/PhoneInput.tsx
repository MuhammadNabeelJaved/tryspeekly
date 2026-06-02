import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { CaretDown, MagnifyingGlass, Check } from '@phosphor-icons/react'
import { useGeo } from '@/context/GeoContext'

interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

// Example local mobile numbers (without dial code) shown as placeholder per country.
const PHONE_EXAMPLES: Record<string, string> = {
  US: '201 555 0123', GB: '7400 123456', CA: '416 555 0123', AU: '412 345 678',
  DE: '1512 3456789', FR: '6 12 34 56 78', ES: '612 345 678', IT: '312 345 6789',
  NL: '6 12345678', BE: '470 12 34 56', CH: '78 123 45 67', AT: '664 123456',
  SE: '70 123 45 67', NO: '412 34 567', DK: '20 12 34 56', FI: '41 2345678',
  PT: '912 345 678', IE: '85 123 4567', NZ: '21 123 4567', SG: '8123 4567',
  HK: '5123 4567', JP: '90 1234 5678', KR: '10 1234 5678', PK: '300 1234567',
  BD: '1812 345678', LK: '71 234 5678', NP: '981 2345678', AF: '70 123 4567',
  IR: '912 345 6789', IQ: '791 234 5678', SY: '944 567 890', YE: '712 345 678',
  JO: '79 123 4567', LB: '71 123 456', PS: '599 123 456', AE: '50 123 4567',
  SA: '51 234 5678', QA: '3312 3456', KW: '5012 3456', BH: '3612 3456',
  OM: '9212 3456', EG: '101 234 5678', ZA: '71 123 4567', NG: '802 123 4567',
  KE: '712 345 678', MA: '650 123456', DZ: '551 23 45 67', TN: '20 123 456',
  GH: '23 123 4567', TZ: '621 234 567', UG: '712 345678', ET: '91 123 4567',
  TR: '501 234 5678', RU: '912 345 6789', UA: '50 123 4567', PL: '512 345 678',
  GR: '691 234 5678', CZ: '601 123 456', RO: '712 345 678', HU: '20 123 4567',
  CN: '131 2345 6789', TH: '81 234 5678', MY: '12 345 6789', ID: '812 3456 7890',
  PH: '917 123 4567', VN: '91 234 56 78', BR: '11 91234 5678', MX: '55 1234 5678',
  AR: '11 2345 6789', CL: '9 6123 4567', CO: '321 1234567', PE: '912 345 678',
  VE: '412 1234567', EC: '99 123 4567', BO: '71234567', PY: '961 456789',
  UY: '94 231 234', DO: '809 234 5678', CU: '5123 4567', JM: '876 123 4567',
  TT: '868 123 4567', TW: '912 345 678', MM: '92 123 4567', KH: '91 234 567',
  LA: '20 23 123 456', BN: '712 3456', MN: '8812 3456', UZ: '90 123 4567',
  KZ: '701 234 5678', TJ: '917 123 456', TM: '65 123456', KG: '700 123 456',
  GE: '555 12 34 56', AM: '77 123456', AZ: '40 123 45 67',
}

/** Pick the country whose dial code the value starts with (longest match wins). */
function detectCountryFromValue(val: string, list: Country[]): Country | null {
  if (!val) return null
  const matches = list.filter(c => val.startsWith(c.dialCode))
  if (!matches.length) return null
  return [...matches].sort((a, b) => b.dialCode.length - a.dialCode.length)[0]
}

const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'HK', name: 'Hong Kong', dialCode: '+852', flag: '🇭🇰' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'AF', name: 'Afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'IR', name: 'Iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'SY', name: 'Syria', dialCode: '+963', flag: '🇸🇾' },
  { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'RO', name: 'Romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'DO', name: 'Dominican Republic', dialCode: '+1', flag: '🇩🇴' },
  { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
  { code: 'JM', name: 'Jamaica', dialCode: '+1', flag: '🇯🇲' },
  { code: 'TT', name: 'Trinidad & Tobago', dialCode: '+1', flag: '🇹🇹' },
  { code: 'TW', name: 'Taiwan', dialCode: '+886', flag: '🇹🇼' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'KH', name: 'Cambodia', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  { code: 'BN', name: 'Brunei', dialCode: '+673', flag: '🇧🇳' },
  { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
  { code: 'UZ', name: 'Uzbekistan', dialCode: '+998', flag: '🇺🇿' },
  { code: 'KZ', name: 'Kazakhstan', dialCode: '+7', flag: '🇰🇿' },
  { code: 'TJ', name: 'Tajikistan', dialCode: '+992', flag: '🇹🇯' },
  { code: 'TM', name: 'Turkmenistan', dialCode: '+993', flag: '🇹🇲' },
  { code: 'KG', name: 'Kyrgyzstan', dialCode: '+996', flag: '🇰🇬' },
  { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
  { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
  { code: 'AZ', name: 'Azerbaijan', dialCode: '+994', flag: '🇦🇿' },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
}

export default function PhoneInput({ value, onChange, placeholder = 'Phone number', label, error }: PhoneInputProps) {
  const geo = useGeo()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    // 1) If a number is already present (e.g. editing in settings), match its dial code
    const fromValue = detectCountryFromValue(value, COUNTRIES)
    if (fromValue) return fromValue
    // 2) Otherwise default to the user's detected country (cached geo may be ready immediately)
    const fromGeo = COUNTRIES.find(c => c.code === geo.country)
    if (fromGeo) return fromGeo
    // 3) Final fallback
    return COUNTRIES.find(c => c.code === 'PK') || COUNTRIES[0]
  })
  // True once the user manually changes the country — stops geo from overriding their choice.
  const userPicked = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // When geo resolves after mount, snap to the detected country —
  // but only if the user hasn't picked one and hasn't typed a number yet.
  useEffect(() => {
    if (userPicked.current || value) return
    const fromGeo = COUNTRIES.find(c => c.code === geo.country)
    if (fromGeo && fromGeo.code !== selectedCountry.code) {
      setSelectedCountry(fromGeo)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.country])

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.dialCode.includes(search) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value.replace(/[^\d]/g, '')
    onChange(`${selectedCountry.dialCode}${phoneNumber}`)
  }

  const handleCountrySelect = (country: Country) => {
    userPicked.current = true
    const currentPhone = value.replace(selectedCountry.dialCode, '')
    setSelectedCountry(country)
    onChange(`${country.dialCode}${currentPhone}`)
    setIsOpen(false)
    setSearch('')
  }

  const displayPhone = value.replace(selectedCountry.dialCode, '')
  // Country-specific example number; falls back to the passed placeholder.
  const phonePlaceholder = PHONE_EXAMPLES[selectedCountry.code]
    ? `e.g. ${PHONE_EXAMPLES[selectedCountry.code]}`
    : placeholder

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
          {label}
        </label>
      )}
      <div className="flex">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-l-xl border border-r-0 border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 outline-none transition-colors ${
              error
                ? 'border-red-400 focus:border-red-500'
                : 'focus:border-violet-500'
            }`}
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium text-slate-700 dark:text-neutral-200">{selectedCountry.dialCode}</span>
            <CaretDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-64 bg-white dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-700 shadow-xl max-h-72 overflow-hidden">
              <div className="p-2 border-b border-slate-100 dark:border-neutral-800">
                <div className="relative">
                  <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search country..."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-48">
                {filteredCountries.map(country => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm text-slate-700 dark:text-neutral-200 flex-1 text-left">{country.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{country.dialCode}</span>
                    {selectedCountry.code === country.code && (
                      <Check size={16} weight="bold" className="text-violet-600" />
                    )}
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">No country found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <input
          type="tel"
          value={displayPhone}
          onChange={handlePhoneChange}
          placeholder={phonePlaceholder}
          className={`flex-1 px-4 py-2.5 rounded-r-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
            error
              ? 'border-red-400 focus:border-red-500'
              : 'focus:border-violet-500'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export { COUNTRIES, type Country }