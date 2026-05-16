import { useState, useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { siteSettingsService } from '@/services/site-settings.service'
import type { PaymentMethodAdmin } from '@/pages/admin/adminData'
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle,
  Globe,
  Clock,
  Headset,
  CaretDown,
  Sparkle,
  Bank,
  Phone,
  CreditCard,
  ArrowCounterClockwise,
  WarningCircle,
  CurrencyDollar,
  UserCircle,
  Scales,
  Receipt,
} from '@phosphor-icons/react'

// ─── ANIMATION VARIANTS ────────────────────────────────────────────────────────

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.1, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── LOGO COMPONENT ───────────────────────────────────────────────────────────

function PaymentLogo({ src, alt, fallbackBg }: { src: string; alt: string; fallbackBg: string }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: fallbackBg }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    </div>
  )
}

function BankTransferIcon({ international = false }: { international?: boolean }) {
  return (
    <div
      className="w-full h-full rounded-2xl flex items-center justify-center"
      style={{ background: international ? 'linear-gradient(135deg,#1E40AF,#3B82F6)' : 'linear-gradient(135deg,#334155,#64748B)' }}
    >
      <Bank size={28} weight="fill" className="text-white" />
    </div>
  )
}

// ─── REAL LOGO URLS (Google Play Store official app icons) ────────────────────

const LOGOS = {
  easypaisa: 'https://play-lh.googleusercontent.com/ahBZCpNP4elK4uI-gImTdi7pLpEwZUMLFngwCfWWHlzOI1GZqwipiv_ekRT--mDcVg4=s512-rw',
  jazzcash:  'https://play-lh.googleusercontent.com/uG93WUUyYVhe-B-5hBqKhr1X--UvgiICOFgD9rK4dbYG3TdqXKjq_TsJU7Pg034dOA=s512-rw',
  sadapay:   'https://play-lh.googleusercontent.com/jLxWI86qzbYgHs7KvooLG9dYRFwmOXhWYwuSMD0KHRgzNrjR6mnSdcJQ2-ZjZICKig=s512-rw',
  nayapay:   'https://play-lh.googleusercontent.com/OaLId--7-ubuipOHiNGR4N-EpFVg9wIGYIw6trOt5tOFKcjvcxdpsuEDfYcWLWJTUx4=s512-rw',
  nsave:     'https://play-lh.googleusercontent.com/EepJU_3DjuHfGCsFtBd2bhRhDS_dUGLcqLpfLZc3oPqu_PLgNV6IJ4Ui4fv6XfxRv0c=s512-rw',
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

type PaymentMethod = {
  id: string
  name: string
  tagline: string
  description: string
  features: string[]
  logoKey: keyof typeof LOGOS | 'bank-local' | 'bank-intl'
  fallbackBg: string
  accentColor: string
  recommended?: boolean
  processingTime: string
}

const LOCAL_METHODS: PaymentMethod[] = [
  {
    id: 'easypaisa',
    name: 'Easypaisa',
    tagline: "Pakistan's #1 Mobile Wallet",
    description: 'Pay instantly using your Easypaisa mobile account or app. No bank account required.',
    features: ['Instant transfer', 'Available 24/7', 'No transaction fee', 'Easy app payment'],
    logoKey: 'easypaisa',
    fallbackBg: '#1BA462',
    accentColor: '#1BA462',
    recommended: true,
    processingTime: 'Instant',
  },
  {
    id: 'jazzcash',
    name: 'JazzCash',
    tagline: "Pakistan's Trusted Mobile Banking",
    description: 'Pay seamlessly through your JazzCash wallet, mobile account, or debit card.',
    features: ['Instant confirmation', 'Mobile number payment', 'Debit card support', 'Secure & encrypted'],
    logoKey: 'jazzcash',
    fallbackBg: '#CC1F00',
    accentColor: '#CC1F00',
    processingTime: 'Instant',
  },
  {
    id: 'sadapay-local',
    name: 'SadaPay',
    tagline: 'Simple. Modern. Pakistani.',
    description: 'Transfer directly from your SadaPay IBAN account to ours in seconds.',
    features: ['IBAN transfer', 'Real-time confirmation', 'Zero fees', 'App & web support'],
    logoKey: 'sadapay',
    fallbackBg: '#161616',
    accentColor: '#7C3AED',
    processingTime: 'Instant',
  },
  {
    id: 'nayapay-local',
    name: 'NayaPay',
    tagline: "Pakistan's Digital Wallet",
    description: 'Pay via NayaPay e-money account using your registered phone number or IBAN.',
    features: ['IBAN & phone transfer', 'Instant settlement', 'No hidden charges', 'SBP regulated'],
    logoKey: 'nayapay',
    fallbackBg: '#5F4FBD',
    accentColor: '#5F4FBD',
    processingTime: 'Instant',
  },
  {
    id: 'nsave',
    name: 'NSave',
    tagline: "Pakistan's Smart Savings App",
    description: 'Use your NSave balance or linked account to pay your course fee securely.',
    features: ['Wallet payment', 'Easy transfer', 'Instant receipt', 'Bank-grade security'],
    logoKey: 'nsave',
    fallbackBg: '#00A896',
    accentColor: '#00A896',
    processingTime: 'Instant',
  },
  {
    id: 'bank-local',
    name: 'Local Bank Transfer',
    tagline: 'All Pakistani Banks Accepted',
    description: 'Transfer from any Pakistani bank — HBL, MCB, UBL, Meezan, Allied, etc. — via IBFT.',
    features: ['All banks supported', 'IBFT / online banking', '1-3 hour clearance', 'Receipt confirmation'],
    logoKey: 'bank-local',
    fallbackBg: '#334155',
    accentColor: '#334155',
    processingTime: '1–3 hours',
  },
]

const INTL_METHODS: PaymentMethod[] = [
  {
    id: 'sadapay-intl',
    name: 'SadaPay',
    tagline: 'Receive from Abroad',
    description: "Send payment from any country using SadaPay's international receiving IBAN.",
    features: ['International IBAN', 'SWIFT-compatible', 'Real-time alerts', 'Regulated by SBP'],
    logoKey: 'sadapay',
    fallbackBg: '#161616',
    accentColor: '#7C3AED',
    recommended: true,
    processingTime: '1–2 business days',
  },
  {
    id: 'nayapay-intl',
    name: 'NayaPay',
    tagline: 'Global Transfers Welcome',
    description: "Receive international remittances through NayaPay's global transfer partnerships.",
    features: ['Global remittance', 'Partner networks', 'Secure & compliant', 'Easy notification'],
    logoKey: 'nayapay',
    fallbackBg: '#5F4FBD',
    accentColor: '#5F4FBD',
    processingTime: '1–3 business days',
  },
  {
    id: 'bank-intl',
    name: 'International Bank Transfer',
    tagline: 'SWIFT / Wire Transfer',
    description: 'Send via SWIFT from any bank worldwide. Accepted from UK, US, UAE, Canada, Australia.',
    features: ['SWIFT / IBAN', 'All currencies', 'All countries', 'Fully secure'],
    logoKey: 'bank-intl',
    fallbackBg: '#1E40AF',
    accentColor: '#1E40AF',
    processingTime: '2–5 business days',
  },
]

const POLICIES = [
  {
    Icon: ArrowCounterClockwise,
    title: 'Refund Policy',
    color: '#8B5CF6',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    points: [
      'Full refund available within 7 days if no class has been attended.',
      '50% refund if only 1 class has been completed and withdrawal is requested within 3 days.',
      'No refund is issued after 2 or more classes have been attended.',
      'Refunds are processed within 5–7 business days to the original payment method.',
      'Course transfers to another batch are allowed free of charge at any time.',
    ],
  },
  {
    Icon: WarningCircle,
    title: 'Failed & Wrong Payments',
    color: '#F59E0B',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    points: [
      'If your payment fails, do not retry immediately — contact our support team first.',
      'Wrong-amount transfers (over or under) must be reported within 24 hours.',
      'We will adjust, refund, or re-enroll you within 2–3 business days.',
      'Duplicate payments are refunded in full within 5 business days.',
      'Always screenshot your transaction before closing the app as proof.',
    ],
  },
  {
    Icon: CurrencyDollar,
    title: 'Currency & Exchange Rate Policy',
    color: '#10B981',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    points: [
      'Local students must pay in Pakistani Rupees (PKR) only.',
      'International students may pay in USD, GBP, AED, CAD, or AUD via bank wire.',
      'Exchange rates are confirmed at the time of enrollment and locked for 48 hours.',
      'We do not accept cryptocurrency or unofficial exchange platforms.',
      'Any bank charges for international transfers are the responsibility of the sender.',
    ],
  },
  {
    Icon: UserCircle,
    title: 'Payment Data & Privacy',
    color: '#3B82F6',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    points: [
      'We never store your card number, wallet PIN, or banking passwords.',
      'Payment receipts you share are used solely for enrollment verification.',
      'Your personal and payment data is never sold or shared with third parties.',
      'All communication regarding payments is via our official WhatsApp or email only.',
      'We will never ask for your OTP, bank password, or card CVV — ever.',
    ],
  },
  {
    Icon: Scales,
    title: 'Dispute Resolution',
    color: '#EC4899',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
    points: [
      'All payment disputes must be raised within 14 days of the transaction date.',
      'Disputes are reviewed and resolved within 3–5 business days.',
      'You will receive a written response to every dispute raised via email.',
      'Unresolved disputes may be escalated to the State Bank of Pakistan (SBP).',
      'Chargebacks initiated without prior contact will be handled on a case-by-case basis.',
    ],
  },
  {
    Icon: Receipt,
    title: 'Receipt & Enrollment Policy',
    color: '#6366F1',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    points: [
      'Enrollment is confirmed only after payment receipt is verified by our team.',
      'Verification is done within 1 hour during working hours (9 AM – 6 PM PKT).',
      'You will receive a confirmation message with your course login details via WhatsApp.',
      'Receipts must include: transaction ID, amount, date, and sender name.',
      'Enrollment is not confirmed until you receive an official confirmation from us.',
    ],
  },
]

const STEPS = [
  { number: '01', title: 'Choose your method', description: 'Select the payment method that works best for you from our local or international options.' },
  { number: '02', title: 'Send the payment', description: 'Transfer the exact course fee to the provided account details. Include your name as a reference.' },
  { number: '03', title: 'Share your receipt', description: 'WhatsApp or email us your transaction screenshot or receipt for verification.' },
  { number: '04', title: 'Get enrolled', description: "Once confirmed (usually within 1 hour), you'll receive your course login credentials." },
]

const FAQS = [
  { q: 'Which payment method is fastest?', a: 'Easypaisa, JazzCash, SadaPay, and NayaPay all provide instant transfers — you\'ll be enrolled within minutes. Local bank transfers (IBFT) typically clear in 1–3 hours.' },
  { q: 'Do you accept international payments?', a: 'Yes! We accept international bank transfers (SWIFT/IBAN), SadaPay international IBAN, and NayaPay global remittances. Students from UK, US, UAE, Canada, Australia, and worldwide are welcome.' },
  { q: 'What currency should I pay in?', a: 'Local students pay in PKR. International students can pay in their local currency (USD, GBP, AED, CAD, AUD) via bank wire — we\'ll confirm the exact PKR equivalent before you transfer.' },
  { q: 'Is it safe to share my payment receipt?', a: 'Absolutely. You only share a screenshot of your completed transaction — we never ask for your bank password, card number, or OTP. All communication is via official WhatsApp or email.' },
  { q: 'What if I make a payment mistake?', a: 'Contact us immediately via WhatsApp or email. Wrong-amount transfers are corrected or refunded within 2–3 business days.' },
]

// ─── LOGO RENDERER ────────────────────────────────────────────────────────────

function MethodLogo({ method }: { method: PaymentMethod }) {
  if (method.logoKey === 'bank-local') return <BankTransferIcon />
  if (method.logoKey === 'bank-intl') return <BankTransferIcon international />
  return (
    <PaymentLogo
      src={LOGOS[method.logoKey as keyof typeof LOGOS]}
      alt={`${method.name} logo`}
      fallbackBg={method.fallbackBg}
    />
  )
}

// ─── PAGE COMPONENT ───────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [expandedPolicy, setExpandedPolicy] = useState<number | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<{ methods: PaymentMethodAdmin[] } | null>(null)

  useEffect(() => {
    siteSettingsService.get()
      .then(settings => {
        if (settings.paymentsSetup) {
          const config = settings.paymentsSetup as { methods?: PaymentMethodAdmin[] }
          if (config.methods?.length) setPaymentConfig({ methods: config.methods })
        }
      })
      .catch(() => {})
  }, [])

  const configLocal = paymentConfig?.methods.filter(m => m.tab === 'local') ?? []
  const configIntl = paymentConfig?.methods.filter(m => m.tab === 'international') ?? []
  const localMethods: PaymentMethod[] = configLocal.length
    ? configLocal.map(m => ({ ...m, logoKey: m.logoKey as PaymentMethod['logoKey'] }))
    : LOCAL_METHODS
  const intlMethods: PaymentMethod[] = configIntl.length
    ? configIntl.map(m => ({ ...m, logoKey: m.logoKey as PaymentMethod['logoKey'] }))
    : INTL_METHODS
  const methods = activeTab === 'local' ? localMethods : intlMethods
  const allMethods = [...localMethods, ...intlMethods]
  const selected = allMethods.find(m => m.id === selectedMethod)
  const selectedAdmin = paymentConfig?.methods.find(m => m.id === selectedMethod)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="relative min-h-screen bg-slate-50 dark:bg-neutral-950 pt-[72px] lg:pt-[80px] overflow-hidden transition-colors duration-300"
    >
      {/* ── Ambient glows ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-200/40 dark:bg-violet-900/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      {/* ── HERO ── */}
      <section className="relative bg-white dark:bg-neutral-900 py-16 lg:py-20 border-b border-slate-100 dark:border-neutral-800 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-violet-100/60 dark:bg-violet-900/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm font-semibold mb-6">
              <Sparkle size={15} weight="fill" />
              Simple & Secure Payments
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-5"
          >
            Flexible{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
              Payment
            </span>{' '}
            Options
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-500 dark:text-neutral-400 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            Pay for your English course the way that suits you — whether you're in Pakistan or anywhere in the world. Fast, safe, and hassle-free.
          </motion.p>

          {/* Trust badges */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            {[
              { Icon: ShieldCheck, label: '100% Secure' },
              { Icon: Lock, label: 'Encrypted' },
              { Icon: Clock, label: 'Fast Confirmation' },
              { Icon: Headset, label: '24/7 Support' },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-slate-600 dark:text-neutral-400 font-medium">
                <Icon size={16} weight="fill" className="text-violet-500" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">

        {/* ── TAB SWITCHER ── */}
        <motion.div variants={itemVariants} className="flex justify-center mb-10">
          <div className="inline-flex bg-white dark:bg-neutral-900 rounded-2xl p-1.5 border border-slate-200 dark:border-neutral-800 shadow-sm">
            {[
              { key: 'local', label: 'Local Payments', Icon: Phone },
              { key: 'international', label: 'International', Icon: Globe },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveTab(key as 'local' | 'international'); setSelectedMethod(null) }}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-violet-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                    : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200'
                }`}
              >
                <Icon size={16} weight={activeTab === key ? 'fill' : 'regular'} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── PAYMENT METHODS + DETAILS (split layout) ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Section label */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">
                {activeTab === 'local' ? 'Pakistani Payment Methods' : 'International Payment Methods'}
              </span>
            </div>

            {/* Split: methods left, details right */}
            <div className={`flex flex-col lg:flex-row gap-6 items-start transition-all duration-300`}>

              {/* ── LEFT: Methods grid ── */}
              <div className={`w-full transition-all duration-300 ${selected ? 'lg:w-[58%]' : 'lg:w-full'}`}>
                <div className={`grid gap-5 ${selected ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {methods.map((method, i) => {
                    const isSelected = selectedMethod === method.id
                    return (
                      <motion.div
                        key={method.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={() => setSelectedMethod(isSelected ? null : method.id)}
                        className={`relative bg-white dark:bg-neutral-900 rounded-[24px] border-2 transition-all duration-200 cursor-pointer group overflow-hidden ${
                          isSelected
                            ? 'border-violet-500 dark:border-violet-500 shadow-[0_0_0_4px_rgba(124,58,237,0.12)]'
                            : 'border-slate-100 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-950/30'
                        }`}
                      >
                        {/* Recommended badge */}
                        {method.recommended && (
                          <div className="absolute top-4 right-4 z-10">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                              <Sparkle size={10} weight="fill" />
                              Recommended
                            </span>
                          </div>
                        )}

                        {/* Hover glow */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{ background: `radial-gradient(circle at 20% 20%, ${method.accentColor}08, transparent 60%)` }}
                        />

                        <div className="p-5 relative">
                          {/* Logo + name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                              <MethodLogo method={method} />
                            </div>
                            <div className={method.recommended ? 'pr-20' : ''}>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{method.name}</h3>
                              <p className="text-xs text-slate-400 dark:text-neutral-500 font-medium mt-0.5">{method.tagline}</p>
                            </div>
                          </div>

                          {/* Features — compact list */}
                          <ul className="space-y-1.5 mb-4">
                            {method.features.map((f) => (
                              <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300">
                                <CheckCircle size={12} weight="fill" className="text-emerald-500 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>

                          {/* Processing time */}
                          <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                            <Clock size={12} weight="fill" className="text-violet-500 flex-shrink-0" />
                            <span className="text-xs text-slate-500 dark:text-neutral-400">Processing:</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-neutral-200 ml-auto">{method.processingTime}</span>
                          </div>

                          {/* CTA */}
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => { e.stopPropagation(); setSelectedMethod(method.id) }}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)]'
                                : 'bg-slate-50 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-700 dark:hover:text-violet-300'
                            }`}
                          >
                            {isSelected ? (
                              <><CheckCircle size={14} weight="fill" />Selected</>
                            ) : (
                              <>Pay with {method.name.split(' ')[0]}<ArrowRight size={13} weight="bold" /></>
                            )}
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* ── RIGHT: Details panel (slides in) ── */}
              <AnimatePresence>
                {selected && (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full lg:w-[42%] lg:sticky lg:top-24"
                  >
                    <div className="bg-white dark:bg-neutral-900 rounded-[28px] border border-violet-200 dark:border-violet-800 p-6 shadow-2xl shadow-violet-100/40 dark:shadow-violet-950/40">

                      {/* Header */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                            <MethodLogo method={selected} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Payment Details</p>
                            <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">Pay via {selected.name}</h3>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod(null)}
                          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-xs font-bold flex-shrink-0"
                          aria-label="Close"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Accent line */}
                      <div className="h-0.5 rounded-full mb-5" style={{ background: `linear-gradient(to right, ${selected.accentColor}, transparent)` }} />

                      {/* Account info */}
                      <div className="space-y-3 mb-5">
                        {[
                          { label: 'Account Title', value: selectedAdmin?.accountTitle || 'EnglishPro Academy' },
                          { label: 'Account / IBAN', value: selectedAdmin?.accountIban || 'PK36 MEZN 0001 2345 0100 6543' },
                          { label: 'Bank Name', value: selectedAdmin?.bankName || 'Meezan Bank Ltd.' },
                          { label: 'Reference', value: selectedAdmin?.reference || 'Your Full Name' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white select-all break-all">{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Processing badge */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 mb-5">
                        <Clock size={13} weight="fill" className="text-violet-500" />
                        <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Processing time:</span>
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-300 ml-auto">{selected.processingTime}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5">
                        <a
                          href={selectedAdmin?.whatsappLink || 'https://wa.me/92XXXXXXXXXX'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
                        >
                          <Phone size={15} weight="fill" />
                          Send Receipt on WhatsApp
                        </a>
                        <a
                          href={`mailto:${selectedAdmin?.receiptEmail || 'payments@englishpro.com'}`}
                          className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors"
                        >
                          <CreditCard size={15} weight="fill" />
                          Email Payment Receipt
                        </a>
                      </div>

                      <p className="text-[11px] text-slate-400 dark:text-neutral-600 text-center mt-4 leading-relaxed">
                        Enrollment confirmed within 1 hour during working hours (9 AM – 6 PM PKT).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </AnimatePresence>

        {/* ── HOW TO PAY STEPS ── */}
        <motion.section variants={itemVariants} className="mt-20">
          <div className="text-center mb-12">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">How It Works</span>
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              4 Simple Steps to Enroll
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 max-w-xl mx-auto">
              From payment to your first class in under 30 minutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.55 }}
                className="relative bg-white dark:bg-neutral-900 rounded-[24px] border border-slate-100 dark:border-neutral-800 p-6 text-center group hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-lg hover:shadow-violet-100/30 dark:hover:shadow-violet-950/20 transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-[0_4px_14px_rgba(124,58,237,0.35)]">
                  <span className="text-xl font-black text-white">{step.number}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECURITY BANNER ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-700 rounded-[28px] p-8 sm:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden sm:block opacity-10">
            <ShieldCheck size={160} weight="fill" className="text-white" />
          </div>

          <div className="relative z-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: ShieldCheck, title: 'SBP Regulated', desc: 'All channels regulated by the State Bank of Pakistan' },
              { Icon: Lock, title: 'End-to-End Encrypted', desc: 'Your transaction data is fully encrypted at all times' },
              { Icon: Bank, title: 'Official Accounts Only', desc: 'We only use verified, registered bank & wallet accounts' },
              { Icon: Headset, title: '24/7 Support', desc: 'Payment issues resolved within 1 hour, any time of day' },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Icon size={20} weight="fill" className="text-white" />
                </div>
                <h4 className="text-white font-bold text-sm">{title}</h4>
                <p className="text-violet-200 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── PAYMENT POLICIES ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20"
        >
          {/* Heading */}
          <div className="text-center mb-12">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">Policies</span>
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Payment Policies
            </h2>
            <p className="text-slate-500 dark:text-neutral-400 max-w-xl mx-auto text-sm leading-relaxed">
              We believe in full transparency. Read our policies to understand your rights and responsibilities as a student.
            </p>
          </div>

          {/* Policy cards accordion — two independent flex columns so expanding one never affects the other */}
          <div className="flex flex-col lg:flex-row gap-4">
            {[POLICIES.filter((_, i) => i % 2 === 0), POLICIES.filter((_, i) => i % 2 === 1)].map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-4 flex-1">
                {col.map((policy) => {
                  const i = POLICIES.indexOf(policy)
                  const isOpen = expandedPolicy === i
                  return (
                    <motion.div
                      key={policy.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.07, duration: 0.5 }}
                      className={`rounded-[20px] border-2 overflow-hidden transition-all duration-200 ${policy.bg} ${
                        isOpen ? policy.border : 'border-transparent hover:' + policy.border.split(' ')[0]
                      }`}
                    >
                      {/* Header button */}
                      <button
                        type="button"
                        onClick={() => setExpandedPolicy(isOpen ? null : i)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left group"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${policy.iconBg} ${isOpen ? 'scale-110' : 'group-hover:scale-105'}`}>
                          <policy.Icon size={20} weight="fill" className={policy.iconColor} />
                        </div>
                        <span className="flex-1 text-sm font-bold text-slate-900 dark:text-white">{policy.title}</span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex-shrink-0"
                        >
                          <CaretDown size={15} className={policy.iconColor} />
                        </motion.span>
                      </button>

                      {/* Expandable content */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                          >
                            <div className="px-5 pb-5">
                              <div className="h-px rounded-full mb-4" style={{ background: `linear-gradient(to right, ${policy.color}40, transparent)` }} />
                              <ul className="space-y-2.5">
                                {policy.points.map((point, j) => (
                                  <motion.li
                                    key={j}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: j * 0.05, duration: 0.3 }}
                                    className="flex items-start gap-2.5"
                                  >
                                    <div
                                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                      style={{ backgroundColor: policy.color }}
                                    />
                                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">{point}</p>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Note */}
          <p className="text-center text-xs text-slate-400 dark:text-neutral-600 mt-6 max-w-xl mx-auto leading-relaxed">
            These policies are subject to change. Any updates will be communicated to enrolled students at least 7 days in advance.
            For questions, contact <a href="mailto:payments@englishpro.com" className="text-violet-500 hover:underline">payments@englishpro.com</a>
          </p>
        </motion.section>

        {/* ── FAQ ── */}
        <motion.section variants={itemVariants} className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center gap-3 justify-center mb-4">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">FAQ</span>
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Payment Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                >
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0"
                  >
                    <CaretDown size={16} className="text-violet-500" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="px-6 pb-5 border-t border-slate-100 dark:border-neutral-800 pt-4">
                        <p className="text-sm text-slate-500 dark:text-neutral-400 leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── CTA BOTTOM ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-500 dark:text-neutral-400 mb-4 text-sm">
            Have questions about payment? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] hover:shadow-[0_12px_36px_rgba(124,58,237,0.45)] transition-all text-sm"
            >
              Contact Support
              <ArrowRight size={16} weight="bold" />
            </a>
            <a
              href="https://wa.me/92XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-3.5 rounded-2xl transition-colors text-sm"
            >
              <Phone size={16} weight="fill" />
              WhatsApp Us
            </a>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
