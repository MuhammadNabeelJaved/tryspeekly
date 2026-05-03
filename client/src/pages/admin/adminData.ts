// ─── STUDENT / INSTRUCTOR / COURSE TYPES ─────────────────────────────────────

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  country: string
  city: string
  courseId: string
  courseName: string
  courseLevel: string
  paymentMethod: string
  paymentAmount: number
  paymentCurrency: string
  paymentStatus: 'paid' | 'pending' | 'failed'
  enrolledAt: string
  status: 'active' | 'completed' | 'inactive'
  notes: string
  avatar: string
  financialAid?: boolean
  certificateId?: string
  certificateIssueDate?: string
  attendance?: number
}

export interface SupportTicket {
  id: string
  studentName: string
  studentAvatar: string
  courseName: string
  subject: string
  status: 'open' | 'closed' | 'pending'
  priority: 'low' | 'medium' | 'high'
  lastMessageAt: string // ISO date string
  messages: SupportMessage[]
}

export interface SupportMessage {
  id: string
  sender: 'student' | 'admin'
  content: string
  timestamp: string // ISO date string
}

export interface FinancialAidApp {
  id: string
  name: string
  email: string
  phone: string
  reason: string
  status: 'pending' | 'under_review' | 'accepted' | 'rejected'
  appliedAt: string
  notes?: string
}

export interface FAQEntry {
  id: string
  question: string
  answer: string
}

export interface Instructor {
  id: string
  name: string
  email: string
  phone: string
  country: string
  specialization: string
  experience: string
  courses: string[]
  totalStudents: number
  rating: number
  status: 'active' | 'inactive'
  bio: string
  joinedAt: string
  avatar: string
  salary: number
}

export interface Course {
  id: string
  title: string
  level: string
  duration: string
  price: number
  currency: string
  instructorId: string
  instructorName: string
  totalStudents: number
  maxStudents: number
  status: 'active' | 'inactive' | 'draft'
  description: string
  startDate: string
  schedule: string
  nextClassTime?: string
  nextClassNumber?: number
  meetingLink?: string
  meetingId?: string
  passcode?: string
  features: string[]
}

// ─── PAYMENTS PAGE SETUP TYPES ────────────────────────────────────────────────

export interface PaymentMethodAdmin {
  id: string
  tab: 'local' | 'international'
  name: string
  tagline: string
  description: string
  features: string[]
  logoKey: string
  logoUrl: string
  fallbackBg: string
  accentColor: string
  recommended: boolean
  processingTime: string
  buttonText: string
  accountTitle: string
  accountIban: string
  bankName: string
  reference: string
  whatsappLink: string
  receiptEmail: string
}

export interface PaymentPolicyAdmin {
  id: string
  title: string
  color: string
  points: string[]
}

export interface PaymentFaqAdmin {
  id: string
  question: string
  answer: string
}

export interface PaymentsPageSetup {
  hero: { badge: string; title: string; subtitle: string }
  trustBadges: { id: string; label: string }[]
  tabs: { localLabel: string; intlLabel: string }
  sectionLabels: { local: string; intl: string }
  methods: PaymentMethodAdmin[]
  stepsSection: { badge: string; title: string; subtitle: string }
  steps: { id: string; number: string; title: string; description: string }[]
  securityBanner: { id: string; title: string; description: string }[]
  policiesSection: { badge: string; title: string; subtitle: string; note: string; noteEmail: string }
  policies: PaymentPolicyAdmin[]
  faqSection: { badge: string; title: string }
  faqs: PaymentFaqAdmin[]
  footer: { message: string; ctaText: string; ctaLink: string; whatsappText: string; whatsappLink: string }
}

export const INITIAL_PAYMENTS_SETUP: PaymentsPageSetup = {
  hero: {
    badge: 'Simple & Secure Payments',
    title: 'Flexible Payment Options',
    subtitle: "Pay for your English course the way that suits you — whether you're in Pakistan or anywhere in the world. Fast, safe, and hassle-free.",
  },
  trustBadges: [
    { id: 'tb1', label: '100% Secure' },
    { id: 'tb2', label: 'Encrypted' },
    { id: 'tb3', label: 'Fast Confirmation' },
    { id: 'tb4', label: '24/7 Support' },
  ],
  tabs: { localLabel: 'Local Payments', intlLabel: 'International' },
  sectionLabels: { local: 'Pakistani Payment Methods', intl: 'International Payment Methods' },
  methods: [
    { id: 'pm1', tab: 'local', name: 'Easypaisa', tagline: "Pakistan's #1 Mobile Wallet", description: 'Pay instantly using your Easypaisa mobile account or app. No bank account required.', features: ['Instant transfer', 'Available 24/7', 'No transaction fee', 'Easy app payment'], logoKey: 'easypaisa', logoUrl: '', fallbackBg: '#1BA462', accentColor: '#1BA462', recommended: true, processingTime: 'Instant', buttonText: 'Pay with Easypaisa', accountTitle: 'EnglishPro Academy', accountIban: '0315-1234567', bankName: 'Easypaisa Mobile Account', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm2', tab: 'local', name: 'JazzCash', tagline: "Pakistan's Trusted Mobile Banking", description: 'Pay seamlessly through your JazzCash wallet, mobile account, or debit card.', features: ['Instant confirmation', 'Mobile number payment', 'Debit card support', 'Secure & encrypted'], logoKey: 'jazzcash', logoUrl: '', fallbackBg: '#CC1F00', accentColor: '#CC1F00', recommended: false, processingTime: 'Instant', buttonText: 'Pay with JazzCash', accountTitle: 'EnglishPro Academy', accountIban: '0321-9876543', bankName: 'JazzCash Mobile Account', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm3', tab: 'local', name: 'SadaPay', tagline: 'Simple. Modern. Pakistani.', description: 'Transfer directly from your SadaPay IBAN account to ours in seconds.', features: ['IBAN transfer', 'Real-time confirmation', 'Zero fees', 'App & web support'], logoKey: 'sadapay', logoUrl: '', fallbackBg: '#161616', accentColor: '#7C3AED', recommended: false, processingTime: 'Instant', buttonText: 'Pay with SadaPay', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 SADP 0001 2345 0100 6543', bankName: 'SadaPay', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm4', tab: 'local', name: 'NayaPay', tagline: "Pakistan's Digital Wallet", description: 'Pay via NayaPay e-money account using your registered phone number or IBAN.', features: ['IBAN & phone transfer', 'Instant settlement', 'No hidden charges', 'SBP regulated'], logoKey: 'nayapay', logoUrl: '', fallbackBg: '#5F4FBD', accentColor: '#5F4FBD', recommended: false, processingTime: 'Instant', buttonText: 'Pay with NayaPay', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 NAYA 0001 2345 0100 6543', bankName: 'NayaPay', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm5', tab: 'local', name: 'NSave', tagline: "Pakistan's Smart Savings App", description: 'Use your NSave balance or linked account to pay your course fee securely.', features: ['Wallet payment', 'Easy transfer', 'Instant receipt', 'Bank-grade security'], logoKey: 'nsave', logoUrl: '', fallbackBg: '#00A896', accentColor: '#00A896', recommended: false, processingTime: 'Instant', buttonText: 'Pay with NSave', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 NSAV 0001 2345 0100 6543', bankName: 'NSave', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm6', tab: 'local', name: 'Local Bank Transfer', tagline: 'All Pakistani Banks Accepted', description: 'Transfer from any Pakistani bank — HBL, MCB, UBL, Meezan, Allied, etc. — via IBFT.', features: ['All banks supported', 'IBFT / online banking', '1-3 hour clearance', 'Receipt confirmation'], logoKey: 'bank-local', logoUrl: '', fallbackBg: '#334155', accentColor: '#334155', recommended: false, processingTime: '1–3 hours', buttonText: 'Pay via Bank', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 MEZN 0001 2345 0100 6543', bankName: 'Meezan Bank Ltd.', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm7', tab: 'international', name: 'SadaPay', tagline: 'Receive from Abroad', description: "Send payment from any country using SadaPay's international receiving IBAN.", features: ['International IBAN', 'SWIFT-compatible', 'Real-time alerts', 'Regulated by SBP'], logoKey: 'sadapay', logoUrl: '', fallbackBg: '#161616', accentColor: '#7C3AED', recommended: true, processingTime: '1–2 business days', buttonText: 'Pay via SadaPay', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 SADP 0001 2345 0100 6543', bankName: 'SadaPay International', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm8', tab: 'international', name: 'NayaPay', tagline: 'Global Transfers Welcome', description: "Receive international remittances through NayaPay's global transfer partnerships.", features: ['Global remittance', 'Partner networks', 'Secure & compliant', 'Easy notification'], logoKey: 'nayapay', logoUrl: '', fallbackBg: '#5F4FBD', accentColor: '#5F4FBD', recommended: false, processingTime: '1–3 business days', buttonText: 'Pay via NayaPay', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 NAYA 0001 2345 0100 6543', bankName: 'NayaPay International', reference: 'Your Full Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
    { id: 'pm9', tab: 'international', name: 'International Bank Transfer', tagline: 'SWIFT / Wire Transfer', description: 'Send via SWIFT from any bank worldwide. Accepted from UK, US, UAE, Canada, Australia.', features: ['SWIFT / IBAN', 'All currencies', 'All countries', 'Fully secure'], logoKey: 'bank-intl', logoUrl: '', fallbackBg: '#1E40AF', accentColor: '#1E40AF', recommended: false, processingTime: '2–5 business days', buttonText: 'Pay via Bank', accountTitle: 'EnglishPro Academy', accountIban: 'PK36 MEZN 0001 2345 0100 6543', bankName: 'Meezan Bank Ltd. (SWIFT: MEZNPKKA)', reference: 'Your Full Name + Course Name', whatsappLink: 'https://wa.me/92300000000', receiptEmail: 'payments@englishpro.com' },
  ],
  stepsSection: { badge: 'How It Works', title: '4 Simple Steps to Enroll', subtitle: 'From payment to your first class in under 30 minutes.' },
  steps: [
    { id: 'st1', number: '01', title: 'Choose your method', description: 'Select the payment method that works best for you from our local or international options.' },
    { id: 'st2', number: '02', title: 'Send the payment', description: 'Transfer the exact course fee to the provided account details. Include your name as a reference.' },
    { id: 'st3', number: '03', title: 'Share your receipt', description: 'WhatsApp or email us your transaction screenshot or receipt for verification.' },
    { id: 'st4', number: '04', title: 'Get enrolled', description: "Once confirmed (usually within 1 hour), you'll receive your course login credentials." },
  ],
  securityBanner: [
    { id: 'sb1', title: 'SBP Regulated', description: 'All channels regulated by the State Bank of Pakistan' },
    { id: 'sb2', title: 'End-to-End Encrypted', description: 'Your transaction data is fully encrypted at all times' },
    { id: 'sb3', title: 'Official Accounts Only', description: 'We only use verified, registered bank & wallet accounts' },
    { id: 'sb4', title: '24/7 Support', description: 'Payment issues resolved within 1 hour, any time of day' },
  ],
  policiesSection: {
    badge: 'Policies',
    title: 'Payment Policies',
    subtitle: 'We believe in full transparency. Read our policies to understand your rights and responsibilities as a student.',
    note: 'These policies are subject to change. Any updates will be communicated to enrolled students at least 7 days in advance. For questions, contact',
    noteEmail: 'payments@englishpro.com',
  },
  policies: [
    { id: 'pol1', title: 'Refund Policy', color: '#8B5CF6', points: ['Full refund available within 7 days if no class has been attended.', '50% refund if only 1 class has been completed and withdrawal is requested within 3 days.', 'No refund is issued after 2 or more classes have been attended.', 'Refunds are processed within 5–7 business days to the original payment method.', 'Course transfers to another batch are allowed free of charge at any time.'] },
    { id: 'pol2', title: 'Failed & Wrong Payments', color: '#F59E0B', points: ['If your payment fails, do not retry immediately — contact our support team first.', 'Wrong-amount transfers (over or under) must be reported within 24 hours.', 'We will adjust, refund, or re-enroll you within 2–3 business days.', 'Duplicate payments are refunded in full within 5 business days.', 'Always screenshot your transaction before closing the app as proof.'] },
    { id: 'pol3', title: 'Currency & Exchange Rate Policy', color: '#10B981', points: ['Local students must pay in Pakistani Rupees (PKR) only.', 'International students may pay in USD, GBP, AED, CAD, or AUD via bank wire.', 'Exchange rates are confirmed at the time of enrollment and locked for 48 hours.', 'We do not accept cryptocurrency or unofficial exchange platforms.', 'Any bank charges for international transfers are the responsibility of the sender.'] },
    { id: 'pol4', title: 'Payment Data & Privacy', color: '#3B82F6', points: ['We never store your card number, wallet PIN, or banking passwords.', 'Payment receipts you share are used solely for enrollment verification.', 'Your personal and payment data is never sold or shared with third parties.', 'All communication regarding payments is via our official WhatsApp or email only.', 'We will never ask for your OTP, bank password, or card CVV — ever.'] },
    { id: 'pol5', title: 'Dispute Resolution', color: '#EC4899', points: ['All payment disputes must be raised within 14 days of the transaction date.', 'Disputes are reviewed and resolved within 3–5 business days.', 'You will receive a written response to every dispute raised via email.', 'Unresolved disputes may be escalated to the State Bank of Pakistan (SBP).', 'Chargebacks initiated without prior contact will be handled on a case-by-case basis.'] },
    { id: 'pol6', title: 'Receipt & Enrollment Policy', color: '#6366F1', points: ['Enrollment is confirmed only after payment receipt is verified by our team.', 'Verification is done within 1 hour during working hours (9 AM – 6 PM PKT).', 'You will receive a confirmation message with your course login details via WhatsApp.', 'Receipts must include: transaction ID, amount, date, and sender name.', 'Enrollment is not confirmed until you receive an official confirmation from us.'] },
  ],
  faqSection: { badge: 'FAQ', title: 'Payment Questions' },
  faqs: [
    { id: 'fq1', question: 'Which payment method is fastest?', answer: "Easypaisa, JazzCash, SadaPay, and NayaPay all provide instant transfers — you'll be enrolled within minutes. Local bank transfers (IBFT) typically clear in 1–3 hours." },
    { id: 'fq2', question: 'Do you accept international payments?', answer: 'Yes! We accept international bank transfers (SWIFT/IBAN), SadaPay international IBAN, and NayaPay global remittances. Students from UK, US, UAE, Canada, Australia, and worldwide are welcome.' },
    { id: 'fq3', question: 'What currency should I pay in?', answer: "Local students pay in PKR. International students can pay in their local currency (USD, GBP, AED, CAD, AUD) via bank wire — we'll confirm the exact PKR equivalent before you transfer." },
    { id: 'fq4', question: 'Is it safe to share my payment receipt?', answer: 'Absolutely. You only share a screenshot of your completed transaction — we never ask for your bank password, card number, or OTP. All communication is via official WhatsApp or email.' },
    { id: 'fq5', question: 'What if I make a payment mistake?', answer: 'Contact us immediately via WhatsApp or email. Wrong-amount transfers are corrected or refunded within 2–3 business days.' },
  ],
  footer: {
    message: "Have questions about payment? We're here to help.",
    ctaText: 'Contact Support',
    ctaLink: '/contact',
    whatsappText: 'WhatsApp Us',
    whatsappLink: 'https://wa.me/92300000000',
  },
}

// ─── CMS TYPES ────────────────────────────────────────────────────────────────

export interface CMSTextField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'url' | 'number' | 'color'
  value: string
}

export interface CMSListField {
  key: string
  label: string
  type: 'list'
  items: string[]
}

export interface CMSRepeaterField {
  key: string
  label: string
  type: 'repeater'
  rowSchema: { key: string; label: string; type: 'text' | 'textarea' | 'url' | 'number' }[]
  rows: Record<string, string>[]
}

export type CMSField = CMSTextField | CMSListField | CMSRepeaterField

export interface CMSSection {
  id: string
  label: string
  fields: CMSField[]
}

export interface CMSPage {
  id: string
  title: string
  slug: string
  sections: CMSSection[]
}

// ─── SETTINGS TYPE ────────────────────────────────────────────────────────────

export interface AdminSettings {
  site: { name: string; tagline: string; logoText: string; footerCopyright: string }
  contact: { phone: string; email: string; whatsapp: string; address: string; workingHours: string }
  social: { facebook: string; instagram: string; twitter: string; linkedin: string; youtube: string }
  seo: { metaTitle: string; metaDescription: string; keywords: string }
  admin: { name: string; email: string; password: string }
}

// ─── INITIAL SETTINGS ─────────────────────────────────────────────────────────

export const INITIAL_SETTINGS: AdminSettings = {
  site: {
    name: 'EnglishPro Academy',
    tagline: 'Master English. Change Your Life.',
    logoText: 'EnglishPro',
    footerCopyright: '© 2026 EnglishPro Academy. All rights reserved.',
  },
  contact: {
    phone: '+801 555 645 45',
    email: 'hello@englishpro.com',
    whatsapp: '+92 300 0000000',
    address: 'Karachi, Pakistan (Online-first Academy)',
    workingHours: 'Mon–Sat · 9 AM – 6 PM PKT',
  },
  social: {
    facebook: 'https://facebook.com/englishpro',
    instagram: 'https://instagram.com/englishpro',
    twitter: 'https://twitter.com/englishpro',
    linkedin: 'https://linkedin.com/company/englishpro',
    youtube: 'https://youtube.com/@englishpro',
  },
  seo: {
    metaTitle: 'EnglishPro Academy — Professional English Courses Online',
    metaDescription: 'Join 2,000+ learners. Expert-led English courses for Pakistani students and international learners. Easypaisa, JazzCash, SadaPay payments accepted.',
    keywords: 'english courses, IELTS preparation, spoken english, business english, pakistan',
  },
  admin: {
    name: 'Admin',
    email: 'admin@englishpro.com',
    password: 'admin123',
  },
}

// ─── INITIAL CMS PAGES ────────────────────────────────────────────────────────

export const INITIAL_CMS_PAGES: CMSPage[] = [
  // ── HOME ────────────────────────────────────────────────────────────────────
  {
    id: 'home',
    title: 'Home',
    slug: '/',
    sections: [
      {
        id: 'home-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Simple. Secure. Payments' },
          { key: 'headline1', label: 'Headline — Part 1', type: 'text', value: 'Master English.' },
          { key: 'headlineHighlight', label: 'Headline — Highlighted Word', type: 'text', value: 'Change' },
          { key: 'headline2', label: 'Headline — Part 2', type: 'text', value: 'Your Life.' },
          { key: 'subheadline', label: 'Sub-headline', type: 'text', value: 'Join 2,000+ learners from Pakistan and beyond' },
          { key: 'description', label: 'Description', type: 'textarea', value: 'Professional English courses designed for Pakistani learners — taught by certified native and expert instructors. Online, flexible, and results-driven.' },
          { key: 'ctaPrimary', label: 'Primary CTA Text', type: 'text', value: 'Explore Courses' },
          { key: 'ctaSecondary', label: 'Secondary CTA Text', type: 'text', value: 'Watch Demo' },
          { key: 'ctaSecondaryLink', label: 'Secondary CTA Link', type: 'url', value: '#features' },
        ] as CMSField[],
      },
      {
        id: 'home-stats',
        label: 'Stats Bar',
        fields: [
          {
            key: 'stats', label: 'Stats', type: 'repeater',
            rowSchema: [
              { key: 'value', label: 'Value', type: 'text' },
              { key: 'label', label: 'Label', type: 'text' },
            ],
            rows: [
              { value: '2,000+', label: 'Students Enrolled' },
              { value: '98%', label: 'Satisfaction Rate' },
              { value: '50+', label: 'Countries Reached' },
              { value: '4.9★', label: 'Average Rating' },
            ],
          } as CMSRepeaterField,
        ],
      },
      {
        id: 'home-features',
        label: 'Features Section',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'Why EnglishPro?' },
          { key: 'title', label: 'Section Title', type: 'text', value: 'Everything You Need to Master English' },
          { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', value: 'We combine expert teaching, flexible scheduling, and proven methods to get you speaking English with confidence.' },
          {
            key: 'features', label: 'Features List', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
            rows: [
              { title: 'Expert Instructors', description: 'Native and certified teachers with 5–15 years of experience in English education.' },
              { title: 'Live Online Classes', description: 'Interactive Zoom sessions — no pre-recorded content. Real-time feedback.' },
              { title: 'Small Batches', description: 'Maximum 15 students per batch for personalised attention and faster progress.' },
              { title: 'Flexible Schedule', description: 'Morning, evening, and weekend batches to fit your lifestyle.' },
              { title: 'Certificate on Completion', description: 'Receive an EnglishPro verified certificate to share on LinkedIn.' },
              { title: 'Lifetime Community Access', description: 'Join our private alumni community for ongoing practice and networking.' },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
      {
        id: 'home-how-it-works',
        label: 'How It Works',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'Getting Started' },
          { key: 'title', label: 'Section Title', type: 'text', value: 'Start Learning in 3 Simple Steps' },
          { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', value: 'From browsing to your first class — it takes less than 24 hours.' },
          {
            key: 'steps', label: 'Steps', type: 'repeater',
            rowSchema: [
              { key: 'number', label: 'Step Number', type: 'text' },
              { key: 'title', label: 'Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
            rows: [
              { number: '01', title: 'Choose Your Course', description: 'Browse our course catalog and find the right level for your goals.' },
              { number: '02', title: 'Make Payment', description: 'Pay via Easypaisa, JazzCash, SadaPay, NayaPay, or bank transfer.' },
              { number: '03', title: 'Start Learning', description: 'Get your login details within 1 hour and join your live class.' },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
      {
        id: 'home-testimonials',
        label: 'Testimonials',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'Student Stories' },
          { key: 'title', label: 'Section Title', type: 'text', value: 'What Our Students Say' },
          { key: 'subtitle', label: 'Section Subtitle', type: 'textarea', value: 'Real results from real students across Pakistan and around the world.' },
          {
            key: 'testimonials', label: 'Testimonials', type: 'repeater',
            rowSchema: [
              { key: 'name', label: 'Student Name', type: 'text' },
              { key: 'role', label: 'Role / Description', type: 'text' },
              { key: 'country', label: 'Country', type: 'text' },
              { key: 'rating', label: 'Rating (1-5)', type: 'number' },
              { key: 'text', label: 'Testimonial Text', type: 'textarea' },
            ],
            rows: [
              { name: 'Ahmed Ali', role: 'IT Professional, Karachi', country: 'Pakistan', rating: '5', text: 'EnglishPro completely transformed my communication skills. I got promoted within 3 months of completing the Business English course!' },
              { name: 'Sara Khan', role: 'University Student, Lahore', country: 'Pakistan', rating: '5', text: 'The IELTS prep course gave me the structured practice I needed. I scored 7.5 band on my first attempt!' },
              { name: 'Omar Farooq', role: 'Software Engineer', country: 'United Kingdom', rating: '5', text: 'Being in London, I needed to sharpen my professional English. The online format was perfect — flexible and high quality.' },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
      {
        id: 'home-cta',
        label: 'CTA Banner',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Limited Seats Available' },
          { key: 'title', label: 'CTA Title', type: 'text', value: 'Ready to Transform Your English?' },
          { key: 'description', label: 'CTA Description', type: 'textarea', value: 'New batch starting soon. Reserve your seat today and start your journey to English fluency.' },
          { key: 'ctaPrimary', label: 'Primary CTA', type: 'text', value: 'Enroll Now' },
          { key: 'ctaSecondary', label: 'Secondary CTA', type: 'text', value: 'View All Courses' },
        ] as CMSField[],
      },
    ],
  },

  // ── ABOUT ────────────────────────────────────────────────────────────────────
  {
    id: 'about',
    title: 'About',
    slug: '/about',
    sections: [
      {
        id: 'about-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'About Us' },
          { key: 'title', label: 'Page Title', type: 'text', value: 'We Believe Every Learner Deserves World-Class English Education' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'Founded in 2020, EnglishPro Academy has helped over 2,000 students from 50+ countries achieve English fluency.' },
          { key: 'foundedYear', label: 'Founded Year', type: 'text', value: '2020' },
          { key: 'location', label: 'Location', type: 'text', value: 'Karachi, Pakistan (Online-first)' },
        ] as CMSField[],
      },
      {
        id: 'about-mission',
        label: 'Mission & Vision',
        fields: [
          { key: 'missionTitle', label: 'Mission Title', type: 'text', value: 'Our Mission' },
          { key: 'mission', label: 'Mission Statement', type: 'textarea', value: 'To deliver the highest quality English education accessible to every Pakistani learner — regardless of location or economic background.' },
          { key: 'visionTitle', label: 'Vision Title', type: 'text', value: 'Our Vision' },
          { key: 'vision', label: 'Vision Statement', type: 'textarea', value: 'A world where language is never a barrier to opportunity. We see a future where every Pakistani professional speaks English with confidence.' },
        ] as CMSField[],
      },
      {
        id: 'about-stats',
        label: 'About Stats',
        fields: [
          {
            key: 'stats', label: 'Achievement Stats', type: 'repeater',
            rowSchema: [
              { key: 'value', label: 'Value', type: 'text' },
              { key: 'label', label: 'Label', type: 'text' },
              { key: 'description', label: 'Short Description', type: 'text' },
            ],
            rows: [
              { value: '2,000+', label: 'Students Enrolled', description: 'Across Pakistan and 50+ countries' },
              { value: '98%', label: 'Satisfaction Rate', description: 'Based on post-course surveys' },
              { value: '50+', label: 'Countries Reached', description: 'Students studying from abroad' },
              { value: '4.9★', label: 'Average Rating', description: 'Across all courses' },
            ],
          } as CMSRepeaterField,
        ],
      },
      {
        id: 'about-values',
        label: 'Our Values',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'What We Stand For' },
          { key: 'title', label: 'Section Title', type: 'text', value: 'Our Core Values' },
          {
            key: 'values', label: 'Values List', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Value Title', type: 'text' },
              { key: 'description', label: 'Description', type: 'textarea' },
            ],
            rows: [
              { title: 'Excellence', description: 'We hold ourselves to the highest teaching standards, continuously improving our curriculum and methods.' },
              { title: 'Accessibility', description: 'Quality education should be affordable and reachable — we keep our fees fair and our classes fully online.' },
              { title: 'Community', description: 'Learning happens together. Our alumni network and live classes build lasting connections.' },
              { title: 'Integrity', description: 'Honest progress tracking, transparent fees, and no hidden charges — ever.' },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
    ],
  },

  // ── COURSES ──────────────────────────────────────────────────────────────────
  {
    id: 'courses',
    title: 'Courses',
    slug: '/courses',
    sections: [
      {
        id: 'courses-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Our Courses' },
          { key: 'title', label: 'Page Title', type: 'text', value: 'Find the Right Course for Your Goals' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'From beginner to advanced, spoken English to IELTS prep — we have a course for every learner.' },
          { key: 'ctaText', label: 'CTA Button Text', type: 'text', value: 'Enroll Now' },
          { key: 'ctaLink', label: 'CTA Button Link', type: 'url', value: '/contact' },
        ] as CMSField[],
      },
      {
        id: 'courses-filter-labels',
        label: 'Filter Labels',
        fields: [
          { key: 'allLabel', label: '"All" Filter Label', type: 'text', value: 'All Courses' },
          { key: 'note', label: 'Enrollment Note', type: 'text', value: 'All courses include a free trial class. No commitment required.' },
        ] as CMSField[],
      },
    ],
  },

  // ── INSTRUCTORS ──────────────────────────────────────────────────────────────
  {
    id: 'instructors',
    title: 'Instructors',
    slug: '/instructors',
    sections: [
      {
        id: 'instructors-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Meet Our Team' },
          { key: 'title', label: 'Page Title', type: 'text', value: 'Learn from the Best' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'Our instructors are certified, experienced professionals passionate about transforming your English skills.' },
          { key: 'ctaText', label: 'CTA Button Text', type: 'text', value: 'Join a Class' },
        ] as CMSField[],
      },
      {
        id: 'instructors-join',
        label: 'Join Our Team Section',
        fields: [
          { key: 'title', label: 'Section Title', type: 'text', value: 'Passionate About Teaching English?' },
          { key: 'description', label: 'Description', type: 'textarea', value: 'We are always looking for talented, certified English instructors to join our growing team. Apply today.' },
          { key: 'ctaText', label: 'CTA Button Text', type: 'text', value: 'Apply to Teach' },
          { key: 'ctaLink', label: 'CTA Button Link', type: 'url', value: '/contact' },
          { key: 'requirements', label: 'Requirements', type: 'list', items: ['Bachelor\'s degree in English or related field', 'Minimum 2 years teaching experience', 'CELTA/DELTA or IELTS examiner certification preferred', 'Reliable internet connection for online teaching', 'Available for at least 3 classes per week'] } as CMSListField,
        ] as CMSField[],
      },
    ],
  },

  // ── BLOG ─────────────────────────────────────────────────────────────────────
  {
    id: 'blog',
    title: 'Blog',
    slug: '/blog',
    sections: [
      {
        id: 'blog-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'English Learning Blog' },
          { key: 'title', label: 'Page Title', type: 'text', value: 'Tips, Guides & Insights' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'Free English learning resources, study tips, IELTS guides, and success stories from our students.' },
        ] as CMSField[],
      },
      {
        id: 'blog-posts',
        label: 'Blog Posts',
        fields: [
          {
            key: 'posts', label: 'Blog Posts', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Post Title', type: 'text' },
              { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
              { key: 'author', label: 'Author Name', type: 'text' },
              { key: 'category', label: 'Category', type: 'text' },
              { key: 'date', label: 'Publish Date', type: 'text' },
              { key: 'readTime', label: 'Read Time', type: 'text' },
              { key: 'imageUrl', label: 'Cover Image URL', type: 'url' },
              { key: 'slug', label: 'URL Slug', type: 'text' },
            ],
            rows: [
              { title: '10 Common English Mistakes Pakistanis Make', excerpt: 'From "I am agree" to "do the mistake" — we break down the most frequent grammar errors and how to fix them permanently.', author: 'Ms. Amna Raza', category: 'Grammar', date: '2026-04-20', readTime: '5 min', imageUrl: '', slug: 'common-english-mistakes' },
              { title: 'How to Score 7+ in IELTS: A Complete Guide', excerpt: 'Band 7 is achievable with the right strategy. Here is the exact framework Dr. Sarah Johnson uses with her IELTS students.', author: 'Dr. Sarah Johnson', category: 'IELTS', date: '2026-04-28', readTime: '8 min', imageUrl: '', slug: 'ielts-7-band-guide' },
              { title: 'Business English: Phrases for Every Meeting', excerpt: '50 professional phrases to make your next meeting confident and polished — from opening the agenda to wrapping up action items.', author: 'Mr. James Williams', category: 'Business English', date: '2026-05-02', readTime: '6 min', imageUrl: '', slug: 'business-english-meeting-phrases' },
            ],
          } as CMSRepeaterField,
        ],
      },
    ],
  },

  // ── CONTACT ──────────────────────────────────────────────────────────────────
  {
    id: 'contact',
    title: 'Contact',
    slug: '/contact',
    sections: [
      {
        id: 'contact-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Get in Touch' },
          { key: 'title', label: 'Page Title', type: 'text', value: "We'd Love to Hear From You" },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'Have a question about our courses, pricing, or payment? Reach out — we reply within 1 hour during working hours.' },
        ] as CMSField[],
      },
      {
        id: 'contact-info',
        label: 'Contact Information',
        fields: [
          { key: 'phone', label: 'Phone Number', type: 'text', value: '+801 555 645 45' },
          { key: 'email', label: 'Email Address', type: 'text', value: 'hello@englishpro.com' },
          { key: 'whatsapp', label: 'WhatsApp Number', type: 'text', value: '+92 300 0000000' },
          { key: 'whatsappLink', label: 'WhatsApp Link', type: 'url', value: 'https://wa.me/92300000000' },
          { key: 'address', label: 'Office Address', type: 'textarea', value: 'Karachi, Pakistan\n(Online-first Academy)' },
          { key: 'hours', label: 'Working Hours', type: 'text', value: 'Mon–Sat · 9 AM – 6 PM PKT' },
          { key: 'responseTime', label: 'Response Time Note', type: 'text', value: 'We typically respond within 1 hour' },
        ] as CMSField[],
      },
      {
        id: 'contact-form-labels',
        label: 'Contact Form Labels',
        fields: [
          { key: 'nameLabel', label: 'Name Field Label', type: 'text', value: 'Full Name' },
          { key: 'emailLabel', label: 'Email Field Label', type: 'text', value: 'Email Address' },
          { key: 'phoneLabel', label: 'Phone Field Label', type: 'text', value: 'Phone Number' },
          { key: 'messageLabel', label: 'Message Field Label', type: 'text', value: 'Your Message' },
          { key: 'submitText', label: 'Submit Button Text', type: 'text', value: 'Send Message' },
          { key: 'successMessage', label: 'Success Message', type: 'textarea', value: "Thank you! We've received your message and will reply within 1 hour." },
        ] as CMSField[],
      },
      {
        id: 'contact-faq',
        label: 'FAQ Section',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'Quick Answers' },
          { key: 'title', label: 'Section Title', type: 'text', value: 'Frequently Asked Questions' },
          {
            key: 'faqs', label: 'FAQ Items', type: 'repeater',
            rowSchema: [
              { key: 'question', label: 'Question', type: 'text' },
              { key: 'answer', label: 'Answer', type: 'textarea' },
            ],
            rows: [
              { question: 'Are classes fully online?', answer: 'Yes! All EnglishPro classes are conducted live via Zoom. You can join from anywhere in the world.' },
              { question: 'How many students are in each class?', answer: 'We keep batches small — maximum 15 students — to ensure personalised attention from your instructor.' },
              { question: 'Can I try a class before enrolling?', answer: 'Absolutely. We offer a free trial class for all new students. Contact us to schedule yours.' },
              { question: 'What happens if I miss a class?', answer: 'All sessions are recorded. Enrolled students get lifetime access to their class recordings.' },
              { question: 'Do you offer group discounts?', answer: 'Yes! Groups of 3 or more students get a 15% discount. Contact us for group enrollment details.' },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
    ],
  },

  // ── PAYMENTS ─────────────────────────────────────────────────────────────────
  {
    id: 'payments',
    title: 'Payments',
    slug: '/payments',
    sections: [
      {
        id: 'payments-hero',
        label: 'Hero Section',
        fields: [
          { key: 'badge', label: 'Badge Text', type: 'text', value: 'Simple & Secure Payments' },
          { key: 'title', label: 'Page Title', type: 'text', value: 'Flexible Payment Options' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', value: 'Pay for your English course the way that suits you — whether you\'re in Pakistan or anywhere in the world. Fast, safe, and hassle-free.' },
        ] as CMSField[],
      },
      {
        id: 'payments-account',
        label: 'Payment Account Details',
        fields: [
          { key: 'accountTitle', label: 'Account Title', type: 'text', value: 'EnglishPro Academy' },
          { key: 'accountIban', label: 'Account / IBAN', type: 'text', value: 'PK36 MEZN 0001 2345 0100 6543' },
          { key: 'bankName', label: 'Bank Name', type: 'text', value: 'Meezan Bank Ltd.' },
          { key: 'whatsapp', label: 'WhatsApp for Receipts', type: 'text', value: '+92 300 0000000' },
          { key: 'whatsappLink', label: 'WhatsApp Link', type: 'url', value: 'https://wa.me/92300000000' },
          { key: 'email', label: 'Email for Receipts', type: 'text', value: 'payments@englishpro.com' },
          { key: 'enrollmentTime', label: 'Enrollment Confirmation Time', type: 'text', value: '1 hour during working hours (9 AM – 6 PM PKT)' },
        ] as CMSField[],
      },
      {
        id: 'payments-steps',
        label: 'How to Pay Steps',
        fields: [
          { key: 'badge', label: 'Section Badge', type: 'text', value: 'How It Works' },
          { key: 'title', label: 'Section Title', type: 'text', value: '4 Simple Steps to Enroll' },
          { key: 'subtitle', label: 'Section Subtitle', type: 'text', value: 'From payment to your first class in under 30 minutes.' },
          {
            key: 'steps', label: 'Payment Steps', type: 'repeater',
            rowSchema: [
              { key: 'number', label: 'Step Number', type: 'text' },
              { key: 'title', label: 'Step Title', type: 'text' },
              { key: 'description', label: 'Step Description', type: 'textarea' },
            ],
            rows: [
              { number: '01', title: 'Choose your method', description: 'Select the payment method that works best for you from our local or international options.' },
              { number: '02', title: 'Send the payment', description: 'Transfer the exact course fee to the provided account details. Include your name as a reference.' },
              { number: '03', title: 'Share your receipt', description: 'WhatsApp or email us your transaction screenshot or receipt for verification.' },
              { number: '04', title: 'Get enrolled', description: "Once confirmed (usually within 1 hour), you'll receive your course login credentials." },
            ],
          } as CMSRepeaterField,
        ] as CMSField[],
      },
      {
        id: 'payments-policies',
        label: 'Payment Policies',
        fields: [
          {
            key: 'policies', label: 'Policy Cards', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Policy Title', type: 'text' },
              { key: 'point1', label: 'Point 1', type: 'textarea' },
              { key: 'point2', label: 'Point 2', type: 'textarea' },
              { key: 'point3', label: 'Point 3', type: 'textarea' },
              { key: 'point4', label: 'Point 4', type: 'textarea' },
              { key: 'point5', label: 'Point 5', type: 'textarea' },
            ],
            rows: [
              { title: 'Refund Policy', point1: 'Full refund available within 7 days if no class has been attended.', point2: '50% refund if only 1 class has been completed and withdrawal is requested within 3 days.', point3: 'No refund is issued after 2 or more classes have been attended.', point4: 'Refunds are processed within 5–7 business days to the original payment method.', point5: 'Course transfers to another batch are allowed free of charge at any time.' },
              { title: 'Failed & Wrong Payments', point1: 'If your payment fails, do not retry immediately — contact our support team first.', point2: 'Wrong-amount transfers must be reported within 24 hours.', point3: 'We will adjust, refund, or re-enroll you within 2–3 business days.', point4: 'Duplicate payments are refunded in full within 5 business days.', point5: 'Always screenshot your transaction before closing the app as proof.' },
            ],
          } as CMSRepeaterField,
        ],
      },
      {
        id: 'payments-faq',
        label: 'Payment FAQ',
        fields: [
          {
            key: 'faqs', label: 'FAQ Items', type: 'repeater',
            rowSchema: [
              { key: 'question', label: 'Question', type: 'text' },
              { key: 'answer', label: 'Answer', type: 'textarea' },
            ],
            rows: [
              { question: 'Which payment method is fastest?', answer: 'Easypaisa, JazzCash, SadaPay, and NayaPay all provide instant transfers — you\'ll be enrolled within minutes.' },
              { question: 'Do you accept international payments?', answer: 'Yes! We accept international bank transfers (SWIFT/IBAN), SadaPay international IBAN, and NayaPay global remittances.' },
              { question: 'What currency should I pay in?', answer: 'Local students pay in PKR. International students can pay in USD, GBP, AED, CAD, or AUD.' },
              { question: 'Is it safe to share my payment receipt?', answer: 'Absolutely. You only share a screenshot of your completed transaction — we never ask for your bank password, card number, or OTP.' },
            ],
          } as CMSRepeaterField,
        ],
      },
    ],
  },

  // ── PRIVACY POLICY ───────────────────────────────────────────────────────────
  {
    id: 'privacy',
    title: 'Privacy Policy',
    slug: '/privacy',
    sections: [
      {
        id: 'privacy-meta',
        label: 'Page Info',
        fields: [
          { key: 'title', label: 'Page Title', type: 'text', value: 'Privacy Policy' },
          { key: 'lastUpdated', label: 'Last Updated Date', type: 'text', value: 'May 2, 2026' },
          { key: 'intro', label: 'Introduction', type: 'textarea', value: 'This Privacy Policy describes how EnglishPro Academy collects, uses, and protects your personal information when you use our website and services.' },
        ] as CMSField[],
      },
      {
        id: 'privacy-sections',
        label: 'Policy Sections',
        fields: [
          {
            key: 'sections', label: 'Policy Sections', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Section Title', type: 'text' },
              { key: 'content', label: 'Section Content', type: 'textarea' },
            ],
            rows: [
              { title: 'Information We Collect', content: 'We collect information you provide directly to us, including your name, email address, phone number, and payment receipt screenshots. We also collect usage data such as pages visited and time spent on the site.' },
              { title: 'How We Use Your Information', content: 'We use the information collected to enroll you in courses, process payments, send course updates, respond to your inquiries, and improve our services. We do not sell your data to third parties.' },
              { title: 'Payment Data', content: 'We do not store card numbers, wallet PINs, or banking passwords. Payment receipts shared by students are used solely for enrollment verification and are kept confidential.' },
              { title: 'Data Security', content: 'All data is stored securely. We use industry-standard encryption for data transmission. Access to student data is restricted to authorized team members only.' },
              { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at privacy@englishpro.com.' },
              { title: 'Contact', content: 'For any privacy-related questions, email us at privacy@englishpro.com or WhatsApp us at +92 300 0000000.' },
            ],
          } as CMSRepeaterField,
        ],
      },
    ],
  },

  // ── TERMS OF SERVICE ─────────────────────────────────────────────────────────
  {
    id: 'terms',
    title: 'Terms of Service',
    slug: '/terms',
    sections: [
      {
        id: 'terms-meta',
        label: 'Page Info',
        fields: [
          { key: 'title', label: 'Page Title', type: 'text', value: 'Terms of Service' },
          { key: 'lastUpdated', label: 'Last Updated Date', type: 'text', value: 'May 2, 2026' },
          { key: 'intro', label: 'Introduction', type: 'textarea', value: 'By enrolling in any EnglishPro Academy course or using our website, you agree to these Terms of Service. Please read them carefully.' },
        ] as CMSField[],
      },
      {
        id: 'terms-sections',
        label: 'Terms Sections',
        fields: [
          {
            key: 'sections', label: 'Terms Sections', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Section Title', type: 'text' },
              { key: 'content', label: 'Section Content', type: 'textarea' },
            ],
            rows: [
              { title: 'Enrollment & Eligibility', content: 'Enrollment is confirmed only after payment verification by our team. Students must provide accurate personal information. We reserve the right to refuse enrollment at our discretion.' },
              { title: 'Course Access', content: 'Enrolled students receive access to their course materials, live classes, and recordings for the duration of their enrollment period. Access may be revoked for violations of our Code of Conduct.' },
              { title: 'Payment Terms', content: 'All fees must be paid in full before the course begins unless a payment plan has been explicitly agreed upon. Fees are non-refundable after the refund period (see Refund Policy).' },
              { title: 'Code of Conduct', content: 'Students are expected to behave respectfully in all classes and communications. Harassment, disruption, or sharing of course materials without permission will result in immediate removal without refund.' },
              { title: 'Intellectual Property', content: 'All course content, materials, and recordings are the intellectual property of EnglishPro Academy. Students may not share, reproduce, or distribute course content without written permission.' },
              { title: 'Limitation of Liability', content: 'EnglishPro Academy is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability is limited to the course fee paid.' },
            ],
          } as CMSRepeaterField,
        ],
      },
    ],
  },

  // ── COOKIE POLICY ─────────────────────────────────────────────────────────────
  {
    id: 'cookies',
    title: 'Cookie Policy',
    slug: '/cookies',
    sections: [
      {
        id: 'cookies-meta',
        label: 'Page Info',
        fields: [
          { key: 'title', label: 'Page Title', type: 'text', value: 'Cookie Policy' },
          { key: 'lastUpdated', label: 'Last Updated Date', type: 'text', value: 'May 2, 2026' },
          { key: 'intro', label: 'Introduction', type: 'textarea', value: 'This Cookie Policy explains how EnglishPro Academy uses cookies and similar tracking technologies when you visit our website.' },
        ] as CMSField[],
      },
      {
        id: 'cookies-sections',
        label: 'Cookie Sections',
        fields: [
          {
            key: 'sections', label: 'Cookie Sections', type: 'repeater',
            rowSchema: [
              { key: 'title', label: 'Section Title', type: 'text' },
              { key: 'content', label: 'Section Content', type: 'textarea' },
            ],
            rows: [
              { title: 'What Are Cookies?', content: 'Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and improve your browsing experience.' },
              { title: 'Essential Cookies', content: 'These cookies are necessary for the website to function correctly. They enable core features such as security, session management, and dark mode preference. They cannot be disabled.' },
              { title: 'Analytics Cookies', content: 'We use analytics cookies to understand how visitors interact with our website. This data helps us improve content and user experience. These cookies are anonymous and cannot identify you personally.' },
              { title: 'Managing Cookies', content: 'You can control and delete cookies through your browser settings. Disabling cookies may affect some functionality of our website. We respect your preference and do not use advertising tracking cookies.' },
              { title: 'Contact', content: 'If you have questions about our Cookie Policy, contact us at privacy@englishpro.com.' },
            ],
          } as CMSRepeaterField,
        ],
      },
    ],
  },
]

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

export const INITIAL_STUDENTS: Student[] = [
  { id: 's1', name: 'Ahmed Ali', email: 'ahmed@gmail.com', phone: '+92 300 1234567', country: 'Pakistan', city: 'Karachi', courseId: 'c1', courseName: 'Business English', courseLevel: 'Intermediate', paymentMethod: 'Easypaisa', paymentAmount: 8000, paymentCurrency: 'PKR', paymentStatus: 'paid', enrolledAt: '2026-04-15', status: 'completed', notes: '', avatar: 'AA', attendance: 95 },
  { id: 's2', name: 'Sara Khan', email: 'sara@gmail.com', phone: '+92 321 9876543', country: 'Pakistan', city: 'Lahore', courseId: 'c2', courseName: 'Spoken English', courseLevel: 'Beginner', paymentMethod: 'JazzCash', paymentAmount: 6000, paymentCurrency: 'PKR', paymentStatus: 'paid', enrolledAt: '2026-04-18', status: 'completed', notes: '', avatar: 'SK', attendance: 88, certificateId: 'EP-2026-SK001', certificateIssueDate: '2026-04-25' },
  { id: 's3', name: 'Omar Farooq', email: 'omar@gmail.com', phone: '+44 7700 123456', country: 'United Kingdom', city: 'London', courseId: 'c3', courseName: 'IELTS Prep', courseLevel: 'Advanced', paymentMethod: 'Bank Transfer (Intl)', paymentAmount: 150, paymentCurrency: 'USD', paymentStatus: 'paid', enrolledAt: '2026-04-20', status: 'active', notes: 'Prefers morning sessions', avatar: 'OF' },
  { id: 's4', name: 'Fatima Malik', email: 'fatima@gmail.com', phone: '+92 333 5556677', country: 'Pakistan', city: 'Islamabad', courseId: 'c1', courseName: 'Business English', courseLevel: 'Intermediate', paymentMethod: 'SadaPay', paymentAmount: 8000, paymentCurrency: 'PKR', paymentStatus: 'paid', enrolledAt: '2026-04-22', status: 'active', notes: '', avatar: 'FM' },
  { id: 's5', name: 'Zainab Hussain', email: 'zainab@gmail.com', phone: '+971 50 123 4567', country: 'UAE', city: 'Dubai', courseId: 'c2', courseName: 'Spoken English', courseLevel: 'Beginner', paymentMethod: 'NayaPay', paymentAmount: 6000, paymentCurrency: 'PKR', paymentStatus: 'pending', enrolledAt: '2026-04-25', status: 'inactive', notes: 'Payment pending verification', avatar: 'ZH' },
  { id: 's6', name: 'Bilal Ahmed', email: 'bilal@gmail.com', phone: '+1 647 555 0199', country: 'Canada', city: 'Toronto', courseId: 'c4', courseName: 'Kids English', courseLevel: 'Kids', paymentMethod: 'Bank Transfer (Intl)', paymentAmount: 120, paymentCurrency: 'USD', paymentStatus: 'paid', enrolledAt: '2026-04-28', status: 'active', notes: '', avatar: 'BA' },
  { id: 's7', name: 'Hina Baig', email: 'hina@gmail.com', phone: '+92 345 7891234', country: 'Pakistan', city: 'Faisalabad', courseId: 'c3', courseName: 'IELTS Prep', courseLevel: 'Advanced', paymentMethod: 'NayaPay', paymentAmount: 10000, paymentCurrency: 'PKR', paymentStatus: 'paid', enrolledAt: '2026-05-01', status: 'active', notes: 'Target band 8', avatar: 'HB' },
  { id: 's8', name: 'Usman Tariq', email: 'usman@gmail.com', phone: '+61 412 345 678', country: 'Australia', city: 'Sydney', courseId: 'c1', courseName: 'Business English', courseLevel: 'Intermediate', paymentMethod: 'Bank Transfer (Intl)', paymentAmount: 150, paymentCurrency: 'USD', paymentStatus: 'failed', enrolledAt: '2026-05-02', status: 'inactive', notes: 'Payment failed — retry requested', avatar: 'UT' },
  { id: 's9', name: 'Mariam Siddiqui', email: 'mariam@gmail.com', phone: '+92 312 0001234', country: 'Pakistan', city: 'Multan', courseId: 'c4', courseName: 'Kids English', courseLevel: 'Kids', paymentMethod: 'Easypaisa', paymentAmount: 5000, paymentCurrency: 'PKR', paymentStatus: 'paid', enrolledAt: '2026-05-03', status: 'active', notes: '', avatar: 'MS' },
  { id: 's10', name: 'Tariq Mehmood', email: 'tariq@gmail.com', phone: '+1 416 777 8888', country: 'USA', city: 'New York', courseId: 'c3', courseName: 'IELTS Prep', courseLevel: 'Advanced', paymentMethod: 'SadaPay (Intl)', paymentAmount: 180, paymentCurrency: 'USD', paymentStatus: 'paid', enrolledAt: '2026-05-04', status: 'active', notes: '', avatar: 'TM' },
]

export const INITIAL_INSTRUCTORS: Instructor[] = [
  { id: 'i1', name: 'Dr. Sarah Johnson', email: 'sarah@englishpro.com', phone: '+92 300 1112233', country: 'UK (Remote)', specialization: 'Business English & IELTS', experience: '12 years', courses: ['Business English', 'IELTS Prep'], totalStudents: 248, rating: 4.9, status: 'active', bio: 'PhD in Applied Linguistics from Cambridge. Certified IELTS examiner with 12 years of teaching experience.', joinedAt: '2022-01-15', avatar: 'SJ', salary: 85000 },
  { id: 'i2', name: 'Mr. James Williams', email: 'james@englishpro.com', phone: '+44 7700 998877', country: 'United Kingdom', specialization: 'Spoken English & Pronunciation', experience: '8 years', courses: ['Spoken English', 'Kids English'], totalStudents: 185, rating: 4.8, status: 'active', bio: 'Native English speaker from London. Specializes in pronunciation coaching and conversational fluency.', joinedAt: '2022-06-01', avatar: 'JW', salary: 75000 },
  { id: 'i3', name: 'Ms. Amna Raza', email: 'amna@englishpro.com', phone: '+92 321 4445566', country: 'Pakistan', specialization: 'Grammar & Academic Writing', experience: '6 years', courses: ['Grammar Mastery', 'Intermediate'], totalStudents: 132, rating: 4.7, status: 'active', bio: 'MA in English Literature. Expert in grammar instruction and academic writing for Pakistani learners.', joinedAt: '2023-03-10', avatar: 'AR', salary: 55000 },
]

export const INITIAL_COURSES: Course[] = [
  { id: 'c1', title: 'Business English', level: 'Intermediate', duration: '3 months', price: 8000, currency: 'PKR', instructorId: 'i1', instructorName: 'Dr. Sarah Johnson', totalStudents: 45, maxStudents: 15, status: 'active', description: 'Master professional English for the modern workplace — emails, meetings, presentations.', startDate: '2026-05-10', schedule: 'Mon/Wed/Fri · 7–8 PM PKT', features: ['Email writing', 'Meeting phrases', 'Presentations', 'Negotiation skills'] },
  { id: 'c2', title: 'Spoken English', level: 'Beginner', duration: '2 months', price: 6000, currency: 'PKR', instructorId: 'i2', instructorName: 'Mr. James Williams', totalStudents: 62, maxStudents: 12, status: 'active', description: 'Build real-world conversational confidence from scratch.', startDate: '2026-05-12', schedule: 'Tue/Thu · 6–7 PM PKT', features: ['Pronunciation', 'Daily conversation', 'Vocabulary', 'Listening skills'] },
  { id: 'c3', title: 'IELTS Preparation', level: 'Advanced', duration: '2 months', price: 10000, currency: 'PKR', instructorId: 'i1', instructorName: 'Dr. Sarah Johnson', totalStudents: 38, maxStudents: 10, status: 'active', description: 'Targeted IELTS coaching for 7+ band score with expert certified examiner.', startDate: '2026-05-15', schedule: 'Daily · 8–9 PM PKT', features: ['All 4 modules', 'Mock tests', 'Band score analysis', 'Personalized feedback'] },
  { id: 'c4', title: 'Kids English', level: 'Kids', duration: '3 months', price: 5000, currency: 'PKR', instructorId: 'i2', instructorName: 'Mr. James Williams', totalStudents: 28, maxStudents: 8, status: 'active', description: 'Fun, interactive English for children aged 6–12 years.', startDate: '2026-05-08', schedule: 'Sat/Sun · 10–11 AM PKT', features: ['Storytelling', 'Phonics', 'Games & activities', 'Reading & writing'] },
  { id: 'c5', title: 'Grammar Mastery', level: 'Beginner', duration: '6 weeks', price: 4500, currency: 'PKR', instructorId: 'i3', instructorName: 'Ms. Amna Raza', totalStudents: 0, maxStudents: 15, status: 'draft', description: 'Zero to hero grammar course — tenses, sentence structure, and more.', startDate: '2026-06-01', schedule: 'Mon/Wed · 5–6 PM PKT', features: ['All tenses', 'Sentence structure', 'Common mistakes', 'Practice exercises'] },
]

export const INITIAL_FINANCIAL_AID: FinancialAidApp[] = [
  { id: 'fa1', name: 'Zohaib Ahmed', email: 'zohaib@example.com', phone: '+92 300 9998888', reason: 'I am a university student and currently unable to pay the full fee. I want to learn English to get a better job.', status: 'pending', appliedAt: '2026-05-01' },
  { id: 'fa2', name: 'Mina Ali', email: 'mina@example.com', phone: '+92 333 1112222', reason: 'I lost my job recently and am looking to upgrade my skills to apply for remote roles.', status: 'under_review', appliedAt: '2026-04-28', notes: 'Scheduled a call for tomorrow' },
  { id: 'fa3', name: 'Khalid Mehmood', email: 'khalid@example.com', phone: '+92 345 7776666', reason: 'My father is a daily wage worker. I need this course to apply for a scholarship abroad.', status: 'accepted', appliedAt: '2026-04-15', notes: 'Enrolled in Spoken English' },
]

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt1',
    studentName: 'Ahmed Ali',
    studentAvatar: 'AA',
    courseName: 'Business English',
    subject: 'Zoom link not working for Class 12',
    status: 'open',
    priority: 'high',
    lastMessageAt: '2026-05-05T10:30:00Z',
    messages: [
      { id: 'msg1', sender: 'student', content: 'Hi, I am unable to join the class. The Zoom link seems to be broken. Can you please help?', timestamp: '2026-05-05T10:00:00Z' },
      { id: 'msg2', sender: 'admin', content: 'Hello Ahmed. We are looking into the issue. Please try this new link: [new-zoom-link.com]', timestamp: '2026-05-05T10:15:00Z' },
      { id: 'msg3', sender: 'student', content: 'Thank you, that worked! I\'m in the class now.', timestamp: '2026-05-05T10:30:00Z' },
    ]
  },
  {
    id: 'tkt2',
    studentName: 'Fatima Malik',
    studentAvatar: 'FM',
    courseName: 'IELTS Preparation',
    subject: 'Assignment submission issue',
    status: 'pending',
    priority: 'medium',
    lastMessageAt: '2026-05-04T15:00:00Z',
    messages: [
      { id: 'msg4', sender: 'student', content: 'Hi, I\'m having trouble uploading my IELTS writing assignment. The file keeps failing to attach.', timestamp: '2026-05-04T14:45:00Z' },
      { id: 'msg5', sender: 'admin', content: 'Hello Fatima. Could you please describe the file type and size? We might need to check the server logs.', timestamp: '2026-05-04T15:00:00Z' },
    ]
  },
  {
    id: 'tkt3',
    studentName: 'Zainab Hussain',
    studentAvatar: 'ZH',
    courseName: 'Spoken English',
    subject: 'Request for class recording',
    status: 'closed',
    priority: 'low',
    lastMessageAt: '2026-05-03T11:00:00Z',
    messages: [
      { id: 'msg6', sender: 'student', content: 'I missed yesterday\'s spoken English class. Can I get access to the recording please?', timestamp: '2026-05-03T10:30:00Z' },
      { id: 'msg7', sender: 'admin', content: 'Hi Zainab, the recording for class is available in your course materials section. Please check there. Let us know if you still have trouble.', timestamp: '2026-05-03T11:00:00Z' },
    ]
  },
]

export const INITIAL_FAQS: FAQEntry[] = [
  {
    id: 'faq1',
    question: 'How do I join my Zoom class?',
    answer: 'You can find the Zoom link for your class in the course materials section of your student dashboard. Click the link 5 minutes before the class starts.',
  },
  {
    id: 'faq2',
    question: 'Can I get a recording of a missed class?',
    answer: 'Yes! Class recordings are uploaded to your course materials section within 24 hours of the class ending. Contact support if a recording is missing.',
  },
  {
    id: 'faq3',
    question: 'How do I submit my assignment?',
    answer: 'Assignments are submitted through the course portal. Navigate to your course, open the relevant class, and use the "Submit Assignment" button. Supported file types: PDF, DOCX, JPG.',
  },
  {
    id: 'faq4',
    question: 'How do I get my certificate?',
    answer: 'Certificates are issued automatically upon successful completion of your course (attendance ≥ 80% and passing the final assessment). You can download it from the Certificates section.',
  },
]
