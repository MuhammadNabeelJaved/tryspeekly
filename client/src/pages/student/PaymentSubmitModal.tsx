import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UploadSimple, CheckCircle, WarningCircle, Phone, Envelope,
  ArrowRight, ShieldCheck, Clock, Sparkle, Bank, ArrowLeft, Globe,
  BookOpen,
} from '@phosphor-icons/react'
import { paymentsService } from '@/services/payments.service'
import type { PaymentMethod } from '@/types/api'

// ─── Logos ─────────────────────────────────────────────────────────────────────

const LOGOS: Record<string, string> = {
  easypaisa:   'https://play-lh.googleusercontent.com/ahBZCpNP4elK4uI-gImTdi7pLpEwZUMLFngwCfWWHlzOI1GZqwipiv_ekRT--mDcVg4=s512-rw',
  jazzcash:    'https://play-lh.googleusercontent.com/uG93WUUyYVhe-B-5hBqKhr1X--UvgiICOFgD9rK4dbYG3TdqXKjq_TsJU7Pg034dOA=s512-rw',
  sadapay:     'https://play-lh.googleusercontent.com/jLxWI86qzbYgHs7KvooLG9dYRFwmOXhWYwuSMD0KHRgzNrjR6mnSdcJQ2-ZjZICKig=s512-rw',
  nayapay:     'https://play-lh.googleusercontent.com/OaLId--7-ubuipOHiNGR4N-EpFVg9wIGYIw6trOt5tOFKcjvcxdpsuEDfYcWLWJTUx4=s512-rw',
  nsave:       'https://play-lh.googleusercontent.com/EepJU_3DjuHfGCsFtBd2bhRhDS_dUGLcqLpfLZc3oPqu_PLgNV6IJ4Ui4fv6XfxRv0c=s512-rw',
  paypal:      'https://www.paypalobjects.com/webstatic/icon/pp258.png',
  credit_card: 'https://www.citypng.com/public/uploads/preview/white-credit-card-icon-hd-png-316246372138kgy50h76u.png',
}

function MethodLogo({ logoKey, fallbackBg, name }: { logoKey: string; fallbackBg: string; name: string }) {
  if (logoKey === 'bank-local' || logoKey === 'bank-intl') {
    const intl = logoKey === 'bank-intl'
    return (
      <div className="w-full h-full rounded-xl flex items-center justify-center"
        style={{ background: intl ? 'linear-gradient(135deg,#1E40AF,#3B82F6)' : 'linear-gradient(135deg,#334155,#64748B)' }}>
        <Bank size={22} weight="fill" className="text-white" />
      </div>
    )
  }
  const src = LOGOS[logoKey as keyof typeof LOGOS] ?? ''
  return (
    <div className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: fallbackBg }}>
      <img src={src} alt={name} className="w-full h-full object-cover" loading="lazy"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
    </div>
  )
}

// ─── Method data ───────────────────────────────────────────────────────────────

type MethodInfo = {
  id: string
  name: string
  tagline: string
  description: string
  features: string[]
  logoKey: string
  fallbackBg: string
  accentColor: string
  recommended?: boolean
  processingTime: string
  whatsappLink: string
  receiptEmail: string
}

const WHATSAPP = 'https://wa.me/923000000000'
const RECEIPT_EMAIL = 'payments@englishpro.com'

const LOCAL_METHODS: MethodInfo[] = [
  {
    id: 'easypaisa', name: 'Easypaisa', tagline: "Pakistan's #1 Mobile Wallet",
    description: 'Pay instantly using your Easypaisa mobile account or app. No bank account required.',
    features: ['Instant transfer', 'Available 24/7', 'No transaction fee', 'Easy app payment'],
    logoKey: 'easypaisa', fallbackBg: '#1BA462', accentColor: '#1BA462',
    recommended: true, processingTime: 'Instant',
    whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'jazzcash', name: 'JazzCash', tagline: "Pakistan's Trusted Mobile Banking",
    description: 'Pay seamlessly through your JazzCash wallet, mobile account, or debit card.',
    features: ['Instant confirmation', 'Mobile number payment', 'Debit card support', 'Secure & encrypted'],
    logoKey: 'jazzcash', fallbackBg: '#CC1F00', accentColor: '#CC1F00',
    processingTime: 'Instant', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'sadapay-local', name: 'SadaPay', tagline: 'Simple. Modern. Pakistani.',
    description: 'Transfer directly from your SadaPay IBAN account to ours in seconds.',
    features: ['IBAN transfer', 'Real-time confirmation', 'Zero fees', 'App & web support'],
    logoKey: 'sadapay', fallbackBg: '#161616', accentColor: '#7C3AED',
    processingTime: 'Instant', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'nayapay-local', name: 'NayaPay', tagline: "Pakistan's Digital Wallet",
    description: 'Pay via NayaPay e-money account using your registered phone number or IBAN.',
    features: ['IBAN & phone transfer', 'Instant settlement', 'No hidden charges', 'SBP regulated'],
    logoKey: 'nayapay', fallbackBg: '#5F4FBD', accentColor: '#5F4FBD',
    processingTime: 'Instant', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'nsave', name: 'NSave', tagline: "Pakistan's Smart Savings App",
    description: 'Use your NSave balance or linked account to pay your course fee securely.',
    features: ['Wallet payment', 'Easy transfer', 'Instant receipt', 'Bank-grade security'],
    logoKey: 'nsave', fallbackBg: '#00A896', accentColor: '#00A896',
    processingTime: 'Instant', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'bank-local', name: 'Local Bank Transfer', tagline: 'All Pakistani Banks Accepted',
    description: 'Transfer from any Pakistani bank via IBFT — HBL, MCB, UBL, Meezan, Allied, etc.',
    features: ['All banks supported', 'IBFT / online banking', '1–3 hour clearance', 'Receipt confirmation'],
    logoKey: 'bank-local', fallbackBg: '#334155', accentColor: '#334155',
    processingTime: '1–3 hours', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
]

const INTL_METHODS: MethodInfo[] = [
  {
    id: 'sadapay-intl', name: 'SadaPay', tagline: 'Receive from Abroad',
    description: "Send payment from any country using SadaPay's international receiving IBAN.",
    features: ['International IBAN', 'SWIFT-compatible', 'Real-time alerts', 'Regulated by SBP'],
    logoKey: 'sadapay', fallbackBg: '#161616', accentColor: '#7C3AED',
    recommended: true, processingTime: '1–2 business days',
    whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'nayapay-intl', name: 'NayaPay', tagline: 'Global Transfers Welcome',
    description: "Receive international remittances through NayaPay's global transfer partnerships.",
    features: ['Global remittance', 'Partner networks', 'Secure & compliant', 'Easy notification'],
    logoKey: 'nayapay', fallbackBg: '#5F4FBD', accentColor: '#5F4FBD',
    processingTime: '1–3 business days', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'bank-intl', name: 'International Bank Transfer', tagline: 'SWIFT / Wire Transfer',
    description: 'Send via SWIFT from any bank worldwide. Accepted from UK, US, UAE, Canada, Australia.',
    features: ['SWIFT / IBAN', 'All currencies', 'All countries', 'Fully secure'],
    logoKey: 'bank-intl', fallbackBg: '#1E40AF', accentColor: '#1E40AF',
    processingTime: '2–5 business days', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
  {
    id: 'paypal', name: 'PayPal', tagline: 'The Safer, Easier Way to Pay Online',
    description: 'Pay quickly and securely using your PayPal account balance or linked cards.',
    features: ['Instant payment', 'Buyer protection', 'Global reach', 'No card details shared'],
    logoKey: 'paypal', fallbackBg: '#0070BA', accentColor: '#0070BA',
    processingTime: 'Instant', whatsappLink: WHATSAPP, receiptEmail: RECEIPT_EMAIL,
  },
]

const ALL_METHODS = [...LOCAL_METHODS, ...INTL_METHODS]

const METHOD_TO_API: Record<string, PaymentMethod> = {
  'easypaisa':     'easypaisa',
  'jazzcash':      'jazzcash',
  'sadapay-local': 'sadapay',
  'nayapay-local': 'nayapay',
  'nsave':         'bank_local',
  'bank-local':    'bank_local',
  'sadapay-intl':  'sadapay',
  'nayapay-intl':  'nayapay',
  'bank-intl':     'bank_international',
  'paypal':        'bank_international',
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  courseId: string
  teacherId: string
  courseName?: string
  coursePrice?: number
  courseCurrency?: 'PKR' | 'USD'
  pricingType?: 'monthly' | 'full_course' | 'per_session'
  offerDiscountedPrice?: number | null
  offerLabel?: string
  couponDiscountApplied?: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PaymentSubmitModal({
  courseId, teacherId, courseName, coursePrice, courseCurrency,
  pricingType,
  offerDiscountedPrice, offerLabel, couponDiscountApplied,
  isOpen, onClose, onSuccess
}: Props) {
  const priceSuffix =
    pricingType === 'monthly' ? '/mo'
    : pricingType === 'per_session' ? '/session'
    : ''

  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && offerDiscountedPrice && offerDiscountedPrice > 0) {
      setAmount(String(offerDiscountedPrice))
    } else if (!isOpen) {
      setAmount('')
    }
  }, [isOpen, offerDiscountedPrice])

  if (!isOpen) return null

  const selectedMethod = ALL_METHODS.find(m => m.id === selectedId) ?? null
  const methodsToDisplay = activeTab === 'local' ? LOCAL_METHODS : INTL_METHODS

  const reset = () => {
    setActiveTab('local')
    setSelectedId(null)
    setTransactionId('')
    setAmount('')
    setCurrency('PKR')
    setFile(null)
    setError('')
    setSuccess(false)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) { setError('Please select a payment method first.'); return }
    if (!file) { setError('Please upload your payment screenshot.'); return }
    if (!amount || Number(amount) <= 0) { setError('Please enter the amount you paid.'); return }
    setLoading(true)
    setError('')
    try {
      await paymentsService.createPayment({
        courseId, teacherId,
        method: METHOD_TO_API[selectedId] ?? 'bank_local',
        transactionId: transactionId || undefined,
        amount: Number(amount),
        currency,
        screenshot: file,
      })
      setSuccess(true)
      setTimeout(() => { reset(); onSuccess() }, 2000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } }
      setError(e?.response?.data?.error?.message || 'Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-neutral-700 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-7 py-4 border-b border-slate-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {selectedId && (
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 transition-colors"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Complete Your Enrollment
              </h3>
              {courseName && (
                <p className="text-[11px] text-slate-400 dark:text-neutral-500 truncate max-w-[260px]">{courseName}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-12 text-center">
            <CheckCircle size={52} weight="fill" className="text-emerald-500 mx-auto mb-4" />
            <p className="font-black text-slate-900 dark:text-white text-lg">Payment submitted!</p>
            <p className="text-sm text-slate-500 dark:text-neutral-400 mt-2">We'll review and activate your enrollment shortly.</p>
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <AnimatePresence mode="wait">

              {/* ── Step 1: Method selection ── */}
              {!selectedId && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Tab switcher */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex bg-slate-100 dark:bg-neutral-800 rounded-2xl p-1.5 gap-1">
                      {[
                        { key: 'local', label: 'Local Payments', Icon: Phone },
                        { key: 'international', label: 'International', Icon: Globe },
                      ].map(({ key, label, Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveTab(key as 'local' | 'international')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            activeTab === key
                              ? 'bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                              : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                          }`}
                        >
                          <Icon size={15} weight={activeTab === key ? 'fill' : 'regular'} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Course info banner */}
                  {(courseName || coursePrice !== undefined) && (
                    <div className="flex items-center justify-between gap-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-2xl px-4 py-3 mb-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen size={16} weight="fill" className="text-violet-600 dark:text-violet-400 flex-shrink-0" />
                        {courseName && (
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{courseName}</p>
                        )}
                      </div>
                      {coursePrice !== undefined && coursePrice > 0 && (
                        <div className="flex-shrink-0 text-right">
                          {offerDiscountedPrice ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-slate-400 dark:text-neutral-500 line-through">
                                {courseCurrency === 'USD' ? `$${coursePrice}${priceSuffix}` : `Rs.${coursePrice.toLocaleString()}${priceSuffix}`}
                              </span>
                              <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                                {courseCurrency === 'USD' ? `$${offerDiscountedPrice}${priceSuffix}` : `Rs.${offerDiscountedPrice.toLocaleString()}${priceSuffix}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                              {courseCurrency === 'USD' ? `$${coursePrice}${priceSuffix}` : `Rs.${coursePrice.toLocaleString()}${priceSuffix}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Section label */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-5 h-[2px] bg-violet-600 rounded-full" />
                    <span className="text-violet-600 dark:text-violet-400 text-xs font-bold tracking-widest uppercase">
                      {activeTab === 'local' ? 'Pakistani Payment Methods' : 'International Payment Methods'}
                    </span>
                  </div>

                  {/* Method cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {methodsToDisplay.map((method, i) => (
                      <motion.div
                        key={method.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.4 }}
                        onClick={() => setSelectedId(method.id)}
                        className="relative bg-white dark:bg-neutral-900 rounded-2xl border-2 border-slate-100 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-950/30 transition-all duration-200 cursor-pointer overflow-hidden group"
                      >
                        {method.recommended && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-600 text-white text-[9px] font-bold uppercase tracking-wide rounded-full">
                              <Sparkle size={8} weight="fill" />
                              Recommended
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 20% 20%, ${method.accentColor}08, transparent 60%)` }} />
                        <div className="p-4 relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              <MethodLogo logoKey={method.logoKey} fallbackBg={method.fallbackBg} name={method.name} />
                            </div>
                            <div className={method.recommended ? 'pr-20' : ''}>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{method.name}</h4>
                              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">{method.tagline}</p>
                            </div>
                          </div>
                          <ul className="space-y-1 mb-3">
                            {method.features.map(f => (
                              <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300">
                                <CheckCircle size={11} weight="fill" className="text-emerald-500 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl mb-3">
                            <Clock size={11} weight="fill" className="text-violet-500 flex-shrink-0" />
                            <span className="text-xs text-slate-500 dark:text-neutral-400">Processing:</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-neutral-200 ml-auto">{method.processingTime}</span>
                          </div>
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setSelectedId(method.id) }}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300 transition-all"
                          >
                            Pay with {method.name.split(' ')[0]} <ArrowRight size={12} weight="bold" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <p className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-neutral-500 mt-6">
                    <ShieldCheck size={14} className="text-emerald-500" weight="fill" />
                    Your payment information is secure and encrypted.
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: Payment details + upload ── */}
              {selectedId && selectedMethod && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Method header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <MethodLogo logoKey={selectedMethod.logoKey} fallbackBg={selectedMethod.fallbackBg} name={selectedMethod.name} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Payment Details</p>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">Pay via {selectedMethod.name}</h4>
                    </div>
                  </div>

                  <div className="h-0.5 rounded-full mb-5" style={{ background: `linear-gradient(to right, ${selectedMethod.accentColor}, transparent)` }} />

                  {/* Course info */}
                  {(courseName || coursePrice !== undefined) && (
                    <div className="flex items-center justify-between gap-3 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-2xl px-4 py-3 mb-5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen size={16} weight="fill" className="text-violet-600 dark:text-violet-400 flex-shrink-0" />
                        {courseName && (
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{courseName}</p>
                        )}
                      </div>
                      {coursePrice !== undefined && coursePrice > 0 && (
                        <div className="flex-shrink-0 text-right">
                          {offerDiscountedPrice ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-slate-400 dark:text-neutral-500 line-through">
                                {courseCurrency === 'USD' ? `$${coursePrice}${priceSuffix}` : `Rs.${coursePrice.toLocaleString()}${priceSuffix}`}
                              </span>
                              <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                                {courseCurrency === 'USD' ? `$${offerDiscountedPrice}${priceSuffix}` : `Rs.${offerDiscountedPrice.toLocaleString()}${priceSuffix}`}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                              {courseCurrency === 'USD' ? `$${coursePrice}${priceSuffix}` : `Rs.${coursePrice.toLocaleString()}${priceSuffix}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Account details */}
                  <p className="text-sm text-slate-600 dark:text-neutral-400 mb-4">{selectedMethod.description}</p>
                  <div className="space-y-2.5 mb-4">
                    {[
                      { label: 'Account Title', value: 'EnglishPro Academy' },
                      { label: 'Account / IBAN', value: 'PK36 MEZN 0001 2345 0100 6543' },
                      { label: 'Bank Name', value: 'Meezan Bank Ltd.' },
                      { label: 'Reference', value: `Your Full Name / Course ID: ${courseId.slice(-8)}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-xl px-4 py-2.5">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white select-all break-all">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Processing time */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 mb-5">
                    <Clock size={13} weight="fill" className="text-violet-500" />
                    <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Processing time:</span>
                    <span className="text-xs font-bold text-violet-700 dark:text-violet-300 ml-auto">{selectedMethod.processingTime}</span>
                  </div>

                  {/* WhatsApp & Email buttons */}
                  <div className="flex flex-col gap-2.5 mb-6">
                    <a
                      href={selectedMethod.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]"
                    >
                      <Phone size={15} weight="fill" />
                      Send Receipt on WhatsApp
                    </a>
                    <a
                      href={`mailto:${selectedMethod.receiptEmail}`}
                      className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)]"
                    >
                      <Envelope size={15} weight="fill" />
                      Email Payment Receipt
                    </a>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
                    <span className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Or upload proof below</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-neutral-700" />
                  </div>

                  {/* Screenshot upload + form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                        <WarningCircle size={16} weight="fill" />
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                        Payment Screenshot <span className="text-red-500">*</span>
                      </label>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => setFile(e.target.files?.[0] ?? null)} />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 text-sm text-slate-500 dark:text-neutral-400 hover:border-violet-400 hover:text-violet-600 dark:hover:border-violet-600 dark:hover:text-violet-400 transition-colors"
                      >
                        <UploadSimple size={16} />
                        {file ? file.name : 'Click to upload payment screenshot'}
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                          Amount Paid <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number" min="1" value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="0"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                        />
                        {offerLabel && offerDiscountedPrice && (
                          <p className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 mt-1 font-semibold">
                            <CheckCircle size={12} weight="fill" />
                            {offerLabel} applied — pay {courseCurrency === 'USD' ? `$${offerDiscountedPrice}${priceSuffix}` : `Rs.${offerDiscountedPrice.toLocaleString()}${priceSuffix}`}
                          </p>
                        )}
                        {couponDiscountApplied != null && couponDiscountApplied > 0 && (
                          <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                            <CheckCircle size={12} weight="fill" />
                            Coupon discount applied — {currency === 'USD' ? `$${couponDiscountApplied}` : `Rs.${couponDiscountApplied.toLocaleString()}`} off
                          </p>
                        )}
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">Currency</label>
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value as 'PKR' | 'USD')}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors"
                        >
                          <option value="PKR">PKR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wide mb-1.5">
                        Transaction ID <span className="normal-case font-normal">(optional)</span>
                      </label>
                      <input
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        placeholder="e.g. TXN123456"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors placeholder-slate-300 dark:placeholder-neutral-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-[0_4px_14px_rgba(124,58,237,0.3)]"
                    >
                      {loading ? 'Submitting…' : 'Submit Payment Proof'}
                    </button>

                    <p className="text-[11px] text-slate-400 dark:text-neutral-600 text-center leading-relaxed">
                      Enrollment confirmed within 1 hour during working hours (9 AM – 6 PM PKT).
                    </p>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
