import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Star, Users, Clock, GraduationCap, CheckCircle,
  PlayCircle, Certificate, FileText, CaretDown,
  ArrowLeft, ArrowRight, Sparkle,
  ChartBar, Tag, Chats, CaretLeft, CaretRight, ThumbsUp,
  Calendar, VideoCamera, UsersThree, ChalkboardTeacher, Laptop,
  CreditCard, Bank, PaypalLogo, ShieldCheck, Phone, Globe
} from '@phosphor-icons/react'
import { coursesService } from '../services/courses.service'
import { enrollmentsService } from '../services/enrollments.service'
import { useAuth } from '../context/AuthContext'

// Dummy Data for the specific course
const COURSE = {
  id: 1,
  title: 'General English Mastery: Live Interactive Cohort',
  category: 'Live Class',
  description: 'Join our intensive 12-week live cohort. Master the fundamentals of English grammar, vocabulary, and daily conversation through real-time interaction, group activities, and live feedback via Zoom/Google Meet.',
  rating: 4.9,
  reviews: 342,
  students: 120, // Smaller number for live cohort
  price: '$299',
  originalPrice: '$399',
  level: 'Beginner to Intermediate',
  duration: '12 Weeks (24 Live Sessions)',
  schedule: 'Tuesdays & Thursdays, 7:00 PM - 8:30 PM (EST)',
  startDate: 'May 10, 2026',
  platform: 'Zoom / Google Meet',
  maxStudents: 25,
  language: 'English',
  image: 'https://images.unsplash.com/photo-1544650030-3c51ad04fe0b?q=80&w=1200&auto=format&fit=crop',
  videoPreview: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
  instructor: {
    name: 'Emily Chen',
    role: 'Lead English Instructor',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    rating: 5.0,
    students: '1,500+',
    courses: 2,
    bio: 'Emily specializes in live, interactive teaching. With over 10 years of experience, she creates a dynamic virtual classroom environment where every student gets personal attention and real-time pronunciation feedback.'
  },
  whatYouWillLearn: [
    'Participate confidently in live conversations and group discussions.',
    'Receive real-time feedback on your pronunciation and grammar.',
    'Collaborate with classmates in Zoom breakout rooms.',
    'Build a robust vocabulary of 3,000+ essential English words.',
    'Write clear, concise emails with live review sessions.',
    'Overcome your fear of speaking in front of others.'
  ],
  curriculum: [
    {
      title: 'Week 1-3: The Foundations of English',
      lessons: 6,
      duration: '9 Hours Live',
      items: [
        { title: 'Orientation & Introduction (Live)', date: 'May 10, 2026', time: '7:00 PM EST', type: 'live', isFree: true },
        { title: 'The Verb "To Be" - Interactive Practice', date: 'May 12, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Subject Pronouns & Breakout Rooms', date: 'May 17, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Week 1-3 Q&A and Live Assessment', date: 'May 26, 2026', time: '7:00 PM EST', type: 'quiz', isFree: false }
      ]
    },
    {
      title: 'Week 4-6: Daily Routines & Activities',
      lessons: 6,
      duration: '9 Hours Live',
      items: [
        { title: 'Present Simple: Group Storytelling', date: 'May 31, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Adverbs of Frequency - Live Polls', date: 'Jun 02, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Telling Time - Partner Activities', date: 'Jun 07, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Vocabulary Workshop: Work and Leisure', date: 'Jun 16, 2026', time: '7:00 PM EST', type: 'live', isFree: false }
      ]
    },
    {
      title: 'Week 7-9: Traveling & Directions',
      lessons: 6,
      duration: '9 Hours Live',
      items: [
        { title: 'Airport Roleplay (Live Pairs)', date: 'Jun 21, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Giving Directions - Virtual Map Task', date: 'Jun 23, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Booking a Hotel Room Simulation', date: 'Jun 28, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Restaurant Roleplay & Group Feedback', date: 'Jul 07, 2026', time: '7:00 PM EST', type: 'live', isFree: false }
      ]
    },
    {
      title: 'Week 10-12: Past Events & Storytelling',
      lessons: 6,
      duration: '9 Hours Live',
      items: [
        { title: 'Past Simple: Sharing Memories', date: 'Jul 12, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Pronunciation Clinic: "-ed" Endings', date: 'Jul 14, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Past Continuous - Group Story Building', date: 'Jul 19, 2026', time: '7:00 PM EST', type: 'live', isFree: false },
        { title: 'Final Presentations & Graduation', date: 'Jul 28, 2026', time: '7:00 PM EST', type: 'live', isFree: false }
      ]
    }
  ],
  reviewsList: [
    { id: 1, author: 'Alex Morgan', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop', rating: 5, date: '1 week ago', content: 'This course is exactly what I needed. Emily explains grammar rules so clearly that they finally make sense. The pacing is perfect, and the practice exercises are very helpful.' },
    { id: 2, author: 'Sarah K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', rating: 4, date: '3 weeks ago', content: 'Great course overall! The vocabulary sections are fantastic. I took off one star just because I wish there were a few more speaking assignments to submit for feedback.' },
    { id: 3, author: 'Mateo R.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', rating: 5, date: '1 month ago', content: 'I have taken many English courses, but this one is by far the best. The production quality is amazing, and I love the interactive elements.' },
    { id: 4, author: 'Elena Petrova', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', rating: 5, date: '2 months ago', content: 'Highly recommend this! My confidence in speaking has grown tremendously. The storytelling module was my absolute favorite.' },
    { id: 5, author: 'David W.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', rating: 4, date: '3 months ago', content: 'Very detailed grammar explanations. Good for intermediate learners looking to brush up on their basics.' },
    { id: 6, author: 'Yuki T.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', rating: 5, date: '4 months ago', content: 'Emily is a wonderful teacher. Her pronunciation is very clear and easy to understand. Thank you for this course!' },
    { id: 7, author: 'Carlos S.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', rating: 5, date: '5 months ago', content: 'Five stars! I passed my B2 exam after finishing this course. The travel vocabulary was incredibly useful for my recent trip to London.' },
    { id: 8, author: 'Nina K.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', rating: 4, date: '6 months ago', content: 'Well structured and very professional. A great investment in my education. The only improvement could be adding more live sessions.' },
  ]
}

const REVIEWS_PER_PAGE = 3

// ─── LOGO COMPONENTS (Copied from PaymentsPage.tsx) ───────────────────────────

function PaymentLogo({ src, alt, fallbackBg }: { src: string; alt: string; fallbackBg: string }) {
  return (
    <div className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: fallbackBg }}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

function BankTransferIcon({ international = false }: { international?: boolean }) {
  return (
    <div
      className="w-full h-full rounded-2xl flex items-center justify-center"
      style={{ background: international ? 'linear-gradient(135deg,#1E40AF,#3B82F6)' : 'linear-gradient(135deg,#334155,#64748B)' }}
    >
      <Bank size={28} weight="fill" className="text-white" />
    </div>
  );
}

// ─── REAL LOGO URLS (Copied from PaymentsPage.tsx) ────────────────────────────

const LOGOS = {
  easypaisa: 'https://play-lh.googleusercontent.com/ahBZCpNP4elK4uI-gImTdi7pLpEwZUMLFngwCfWWHlzOI1GZqwipiv_ekRT--mDcVg4=s512-rw',
  jazzcash:  'https://play-lh.googleusercontent.com/uG93WUUyYVhe-B-5hBqKhr1X--UvgiICOFgD9rK4dbYG3TdqXKjq_TsJU7Pg034dOA=s512-rw',
  sadapay:   'https://play-lh.googleusercontent.com/jLxWI86qzbYgHs7KvooLG9dYRFwmOXhWYwuSMD0KHRgzNrjR6mnSdcJQ2-ZjZICKig=s512-rw',
  nayapay:   'https://play-lh.googleusercontent.com/OaLId--7-ubuipOHiNGR4N-EpFVg9wIGYIw6trOt5tOFKcjvcxdpsuEDfYcWLWJTUx4=s512-rw',
  nsave:     'https://play-lh.googleusercontent.com/EepJU_3DjuHfGCsFtBd2bhRhDS_dUGLcqLpfLZc3oPqu_PLgNV6IJ4Ui4fv6XfxRv0c=s512-rw',
  paypal:    'https://play-lh.googleusercontent.com/bE_qL120v2g60K0L2K5vXw_hT662gI84wB3n_f3a-nO_n8W6_k_q_k_k_q_k_q_k_q_k=s512-rw',
  credit_card: 'https://www.citypng.com/public/uploads/preview/white-credit-card-icon-hd-png-316246372138kgy50h76u.png',
};

// ─── DATA (Copied from PaymentsPage.tsx and extended for Credit Card/PayPal) ──

type PaymentMethod = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  logoKey: keyof typeof LOGOS | 'bank-local' | 'bank-intl';
  fallbackBg: string;
  accentColor: string;
  recommended?: boolean;
  processingTime: string;
};

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
  {
    id: 'credit_card',
    name: 'Credit Card',
    tagline: 'Secure Online Payment',
    description: 'Pay using your Visa, MasterCard, or other major credit/debit cards.',
    features: ['Instant payment', 'Globally accepted', 'Secure & encrypted', 'Fraud protection'],
    logoKey: 'credit_card',
    fallbackBg: '#6B7280',
    accentColor: '#8B5CF6',
    processingTime: 'Instant',
    recommended: true,
  },
];

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
  {
    id: 'paypal',
    name: 'PayPal',
    tagline: 'The Safer, Easier Way to Pay Online',
    description: 'Pay quickly and securely using your PayPal account balance or linked cards.',
    features: ['Instant payment', 'Buyer protection', 'Global reach', 'No card details shared'],
    logoKey: 'paypal',
    fallbackBg: '#0070BA',
    accentColor: '#0070BA',
    processingTime: 'Instant',
  },
];

// ─── LOGO RENDERER (Copied from PaymentsPage.tsx) ────────────────────────────

function MethodLogo({ method }: { method: PaymentMethod }) {
  if (method.logoKey === 'bank-local') return <BankTransferIcon />;
  if (method.logoKey === 'bank-intl') return <BankTransferIcon international />;
  return (
    <PaymentLogo
      src={LOGOS[method.logoKey as keyof typeof LOGOS]}
      alt={`${method.name} logo`}
      fallbackBg={method.fallbackBg}
    />
  );
}


export default function CourseDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [openModule, setOpenModule] = useState<number | null>(0)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [currentReviewPage, setCurrentReviewPage] = useState(1)
  const [apiCourse, setApiCourse] = useState<any>(null)

  // New states for enrollment modal
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'local' | 'international'>('local');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      coursesService.getCourseById(id).then(res => setApiCourse(res.data)).catch(() => {})
    }
  }, [id])

  // Merge API data into COURSE object for display
  const activeCourse = apiCourse
    ? {
        ...COURSE,
        id: apiCourse._id,
        title: apiCourse.title,
        description: apiCourse.description,
        price: apiCourse.currency === 'PKR' ? `Rs.${apiCourse.price.toLocaleString()}` : `$${apiCourse.price}`,
        level: apiCourse.level.charAt(0).toUpperCase() + apiCourse.level.slice(1),
        duration: `${apiCourse.totalSessions} Sessions`,
        image: apiCourse.thumbnail || activeCourse.image,
        students: apiCourse.enrolledStudents?.length || 0,
        instructor: {
          ...activeCourse.instructor,
          name: apiCourse.teacher?.name || activeCourse.instructor.name,
        },
      }
    : COURSE

  const totalReviewPages = Math.ceil(activeCourse.reviewsList.length / REVIEWS_PER_PAGE)
  const currentReviews = activeCourse.reviewsList.slice(
    (currentReviewPage - 1) * REVIEWS_PER_PAGE,
    currentReviewPage * REVIEWS_PER_PAGE
  )

  const scrollToReviews = () => {
    const el = document.getElementById('reviews-section')
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // New function to scroll to payment section
  const openEnrollmentModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/courses/${id}` } } });
      return;
    }
    setShowEnrollmentModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentReviewPage(page)
    scrollToReviews()
  }

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowMobileNav(true)
      } else {
        setShowMobileNav(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const allMethods = [...LOCAL_METHODS, ...INTL_METHODS];
  const selectedPaymentDetails = allMethods.find(m => m.id === selectedPaymentMethod);
  const methodsToDisplay = activeTab === 'local' ? LOCAL_METHODS : INTL_METHODS;


  const renderPaymentDetails = () => {
    if (!selectedPaymentDetails) {
      return (
        <p className="text-slate-500 dark:text-neutral-400 mt-6 text-center">
          Please select a payment method to see details.
        </p>
      );
    }

    // Handle generic Credit Card form
    if (selectedPaymentDetails.id === 'credit_card') {
      return (
        <div className="space-y-4">
          <div>
            <label htmlFor="cardNumber" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Card Number</label>
            <input type="text" id="cardNumber" className="w-full p-3 border border-slate-300 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" placeholder="XXXX XXXX XXXX XXXX" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                  <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Expiry Date</label>
                  <input type="text" id="expiryDate" className="w-full p-3 border border-slate-300 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" placeholder="MM/YY" />
                </div>
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">CVV</label>
                  <input type="text" id="cvv" className="w-full p-3 border border-slate-300 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" placeholder="123" />
                </div>
          </div>
            <div>
              <label htmlFor="cardName" className="block text-sm font-medium text-slate-700 dark:text-neutral-300 mb-1">Name on Card</label>
              <input type="text" id="cardName" className="w-full p-3 border border-slate-300 dark:border-neutral-700 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all" placeholder="Full Name" />
            </div>
            <button className="mt-8 w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.45)] transition-all flex items-center justify-center gap-2">
              Complete Payment
            </button>
        </div>
      );
    }

    // Handle generic PayPal button
    if (selectedPaymentDetails.id === 'paypal') {
      return (
        <div className="space-y-4">
          <p className="text-slate-700 dark:text-neutral-300 mb-4">
            Click the button below to be redirected to PayPal's secure payment gateway.
          </p>
          <button className="mt-8 w-full bg-[#0070BA] hover:bg-[#005F99] text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_14px_rgba(0,112,186,0.35)] hover:shadow-[0_6px_20px_rgba(0,112,186,0.45)] transition-all flex items-center justify-center gap-2">
            <PaypalLogo size={24} weight="fill" /> Pay with PayPal
          </button>
        </div>
      );
    }

    // Default rendering for other payment methods (e.g., bank transfers, mobile wallets)
    return (
      <div className="space-y-3">
        <p className="text-slate-700 dark:text-neutral-300 mb-4">
          {selectedPaymentDetails.description}
        </p>
        <div className="space-y-3 mb-5">
          {[
            { label: 'Account Title', value: 'EnglishPro Academy' },
            { label: 'Account / IBAN', value: 'PK36 MEZN 0001 2345 0100 6543' }, // Dummy IBAN
            { label: 'Bank Name', value: 'Meezan Bank Ltd.' },
            { label: 'Reference', value: 'Your Full Name / Course ID: ' + activeCourse.id },
            { label: 'Amount', value: activeCourse.price },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 dark:bg-neutral-800/60 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white select-all break-all">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900 mb-5">
          <Clock size={13} weight="fill" className="text-violet-500" />
          <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">Processing time:</span>
          <span className="text-xs font-bold text-violet-700 dark:text-violet-300 ml-auto">{selectedPaymentDetails.processingTime}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <a
            href="https://wa.me/92XXXXXXXXXX" // Replace with actual WhatsApp number
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)]"
          >
            <Phone size={15} weight="fill" />
            Send Receipt on WhatsApp
          </a>
          <a
            href="mailto:payments@englishpro.com"
            className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.45)]"
          >
            <CreditCard size={15} weight="fill" />
            Email Payment Receipt
          </a>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-neutral-600 text-center mt-4 leading-relaxed">
          Enrollment confirmed within 1 hour during working hours (9 AM – 6 PM PKT).
        </p>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] pb-24 lg:pb-0 selection:bg-violet-200 dark:selection:bg-violet-900/50">

      {/* ─── CREATIVE HERO HEADER ──────────────────────────────── */}
      <div className="relative bg-slate-900 dark:bg-black text-white pt-12 pb-24 lg:pt-16 lg:pb-32 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to="/courses" className="inline-flex items-center gap-2 text-violet-300 hover:text-white transition-colors text-sm font-medium mb-6 group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Courses
              </Link>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-lg uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <Sparkle size={14} weight="fill" />
                  Bestseller
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 text-slate-300 text-xs font-bold rounded-lg uppercase tracking-wider backdrop-blur-sm">
                  {activeCourse.category}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight text-white drop-shadow-sm">
                {activeCourse.title}
              </h1>

              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl font-light">
                {activeCourse.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">
                    <Star size={16} weight="fill" />
                    <span className="text-base">{activeCourse.rating}</span>
                  </div>
                  <button onClick={() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })
                  }} className="text-slate-300 border-b border-slate-600 border-dashed pb-0.5 cursor-pointer hover:text-white transition-colors">
                    ({activeCourse.reviews.toLocaleString()} reviews)
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <UsersThree size={18} className="text-violet-400" />
                  <span><strong>Max {activeCourse.maxStudents}</strong> per cohort</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar size={18} className="text-emerald-400" />
                  <span>Starts: <strong>{activeCourse.startDate}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <VideoCamera size={18} className="text-blue-400" />
                  <span>{activeCourse.platform}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── MAIN CONTENT LAYOUT ──────────────────────────────── */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 relative items-start -mt-8 lg:-mt-0">

            {/* ── Left Column (Content) ── */}
            <div className="space-y-12 lg:py-12">

              {/* Mobile Video Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:hidden relative rounded-3xl overflow-hidden aspect-video shadow-2xl border border-slate-200 dark:border-neutral-800 bg-slate-900 group"
              >
                <img src={activeCourse.videoPreview} alt="Course preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-violet-600 rounded-full animate-ping opacity-40"></div>
                    <button className="relative w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-violet-600 transition-all duration-300 shadow-2xl">
                      <PlayCircle size={40} weight="fill" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* What You'll Learn */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <ChartBar size={24} weight="fill" />
                  </div>
                  What you'll learn
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeCourse.whatYouWillLearn.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-600/5 transition-all duration-300 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <CheckCircle size={16} weight="bold" />
                      </div>
                      <span className="text-slate-700 dark:text-neutral-300 text-sm leading-relaxed font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Curriculum */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <Calendar size={24} weight="fill" />
                      </div>
                      Live Session Schedule
                    </h2>
                    <p className="text-slate-500 dark:text-neutral-400 text-sm font-medium ml-13">
                      {activeCourse.schedule} • {activeCourse.duration}
                    </p>
                  </div>
                  <button className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-900/20 px-4 py-2 rounded-lg">
                    Expand All
                  </button>
                </div>

                <div className="space-y-4">
                  {activeCourse.curriculum.map((module, i) => (
                    <div key={i} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <button
                        onClick={() => setOpenModule(openModule === i ? null : i)}
                        className="w-full flex items-center justify-between p-5 lg:p-6 bg-transparent hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-5 text-left">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${openModule === i ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 group-hover:bg-violet-100 dark:group-hover:text-violet-600'}`}>
                            {(i + 1).toString().padStart(2, '0')}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-base lg:text-lg mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{module.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-neutral-400 font-medium">
                              <span className="flex items-center gap-1"><VideoCamera size={14} /> {module.lessons} sessions</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                              <span className="flex items-center gap-1"><Clock size={14} /> {module.duration}</span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: openModule === i ? 180 : 0 }}
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openModule === i ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-neutral-500 group-hover:bg-slate-200 dark:group-hover:bg-neutral-700'}`}
                        >
                          <CaretDown size={16} weight="bold" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {openModule === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 pt-2">
                              <div className="pl-12 space-y-1 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-px before:bg-slate-200 dark:before:bg-neutral-800">
                                {module.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-neutral-800/80 transition-colors group relative">
                                    <div className="absolute left-[-32px] w-2 h-2 rounded-full bg-slate-300 dark:bg-neutral-700 group-hover:bg-violet-500 transition-colors ring-4 ring-white dark:ring-neutral-900" />

                                    <div className="flex items-center gap-3">
                                      {item.type === 'live' ? (
                                        <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                          <VideoCamera size={16} weight="fill" />
                                        </div>
                                      ) : item.type === 'document' ? (
                                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                          <FileText size={16} weight="fill" />
                                        </div>
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                          <CheckCircle size={16} weight="fill" />
                                        </div>
                                      )}
                                      <span className={`text-sm font-medium ${item.isFree ? 'text-violet-600 dark:text-violet-400 underline decoration-violet-200 dark:decoration-violet-900/50 underline-offset-4 cursor-pointer hover:decoration-violet-600' : 'text-slate-700 dark:text-neutral-300'}`}>
                                        {item.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {item.isFree && (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-600 text-white uppercase tracking-wider shadow-sm shadow-violet-600/30">
                                          Preview
                                        </span>
                                      )}
                                      <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold flex items-center gap-1.5"><Calendar size={14}/> {item.date} • {item.time}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Instructor Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-8 sm:p-10 overflow-hidden shadow-sm"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-100 to-transparent dark:from-violet-900/20 opacity-50 rounded-bl-full pointer-events-none" />

                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 relative z-10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                    <GraduationCap size={24} weight="fill" />
                  </div>
                  Your Instructor
                </h2>

                <div className="flex flex-col sm:flex-row gap-8 items-start relative z-10">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                    <img
                      src={activeCourse.instructor.image}
                      alt={activeCourse.instructor.name}
                      className="relative w-36 h-36 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-950 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star size={12} weight="fill" /> {activeCourse.instructor.rating}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 transition-colors">{activeCourse.instructor.name}</h3>
                    <p className="text-violet-600 dark:text-violet-400 font-bold text-sm mb-5 uppercase tracking-wider">{activeCourse.instructor.role}</p>

                    <div className="flex flex-wrap gap-5 mb-5 pb-5 border-b border-slate-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300 font-semibold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                          <Users size={16} weight="fill" />
                        </div>
                        {activeCourse.instructor.students} Students
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300 font-semibold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                          <PlayCircle size={16} weight="fill" />
                        </div>
                        {activeCourse.instructor.courses} Courses
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-neutral-400 text-base leading-relaxed italic border-l-4 border-violet-200 dark:border-violet-900/50 pl-4">
                      "{activeCourse.instructor.bio}"
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* ── REVIEWS SECTION ── */}
              <motion.div
                id="reviews-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="scroll-mt-32 pt-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                        <Chats size={24} weight="fill" />
                      </div>
                      Student Reviews
                    </h2>
                    <div className="flex items-center gap-3 ml-13">
                      <div className="flex gap-1 text-yellow-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={18} weight={s <= Math.floor(activeCourse.rating) ? "fill" : "regular"} />
                        ))}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCourse.rating} Course Rating</span>
                      <span className="text-slate-400 dark:text-neutral-500">•</span>
                      <span className="text-slate-500 dark:text-neutral-400">{activeCourse.reviews.toLocaleString()} reviews</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <AnimatePresence mode="popLayout">
                    {currentReviews.map((review) => (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-900/50 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row gap-5 items-start">
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="w-14 h-14 rounded-full object-cover border border-slate-100 dark:border-neutral-800"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg">{review.author}</h4>
                              <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">{review.date}</span>
                            </div>
                            <div className="flex gap-1 text-yellow-400 mb-4">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={14} weight={s <= review.rating ? "fill" : "regular"} />
                              ))}
                            </div>
                            <p className="text-slate-600 dark:text-neutral-300 text-sm leading-relaxed mb-4">
                              {review.content}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 dark:text-neutral-500 font-medium mr-2">Helpful?</span>
                              <button className="w-8 h-8 rounded-full border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:border-violet-600 hover:bg-violet-50 transition-colors">
                                <ThumbsUp size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalReviewPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-neutral-800 pt-6">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentReviewPage - 1))}
                      disabled={currentReviewPage === 1}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300"
                    >
                      <CaretLeft size={16} weight="bold" /> Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalReviewPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i + 1)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                            currentReviewPage === i + 1
                              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-neutral-800 dark:text-neutral-400'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(Math.min(totalReviewPages, currentReviewPage + 1))}
                      disabled={currentReviewPage === totalReviewPages}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300"
                    >
                      Next <CaretRight size={16} weight="bold" />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Right Column (Sticky Floating Sidebar) ── */}
            <div className="hidden lg:block relative z-20 -mt-56">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-[100px] bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
              >
                {/* Video Preview */}
                <div className="relative aspect-video bg-slate-100 dark:bg-neutral-800 group cursor-pointer overflow-hidden m-2 rounded-2xl">
                  <img src={activeCourse.videoPreview} alt="Course preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20"></div>
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-md border border-white/50 rounded-full flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-violet-600 group-hover:border-violet-600 transition-all duration-300 shadow-2xl">
                        <PlayCircle size={40} weight="fill" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white font-bold text-sm tracking-wide drop-shadow-md">
                    Meet Your Instructor
                  </div>
                </div>

                <div className="p-8">
                  {/* Pricing Details */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-end gap-3">
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{activeCourse.price}</span>
                      <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">{activeCourse.originalPrice}</span>
                    </div>
                    <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Tag size={12} weight="fill" />
                      33% OFF
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold mb-6">
                    <Clock size={14} weight="bold" />
                    <span>Limited time offer! Ends in 2 days</span>
                  </div>

                  {/* Primary CTA */}
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openEnrollmentModal} // Open enrollment modal
                    className="w-full flex items-center justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all mb-4 text-lg"
                  >
                    Enroll Now
                  </motion.button>
                  <p className="text-center text-xs text-slate-500 dark:text-neutral-400 mb-8 font-medium">
                    7-Day Refund Policy • Session Recordings Included
                  </p>

                  {/* Course Includes */}
                  <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-5 mb-8">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">This live cohort includes:</h4>
                    <ul className="space-y-4">
                      {[
                        { icon: VideoCamera, text: '24 Interactive Live Sessions' },
                        { icon: UsersThree, text: `Intimate cohort (Max ${activeCourse.maxStudents})` },
                        { icon: ChalkboardTeacher, text: 'Real-time teacher feedback' },
                        { icon: Laptop, text: 'Access to session recordings' },
                        { icon: Certificate, text: 'Certificate of completion' }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-700 dark:text-neutral-300 font-medium">
                          <item.icon size={18} className="text-violet-500 flex-shrink-0" weight="duotone" />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meta Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-neutral-800 pb-3">
                      <span className="text-slate-500 dark:text-neutral-400">Skill Level</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCourse.level}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-neutral-800 pb-3">
                      <span className="text-slate-500 dark:text-neutral-400">Platform</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCourse.platform}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-neutral-800 pb-3">
                      <span className="text-slate-500 dark:text-neutral-400">Starts</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCourse.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-neutral-400">Language</span>
                      <span className="font-bold text-slate-900 dark:text-white">{activeCourse.language}</span>
                    </div>
                  </div>

                  {/* Share link */}
                  <div className="mt-8 text-center">
                    <button className="text-violet-600 dark:text-violet-400 text-sm font-bold hover:underline underline-offset-4">
                      Share this course
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── ENROLLMENT MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {showEnrollmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowEnrollmentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowEnrollmentModal(false)}
                className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-lg font-bold"
                aria-label="Close modal"
              >
                ✕
              </button>

              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Complete Your Enrollment</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  {/* Left Column: Course Details Summary for Enrollment */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <div className="mb-6">
                      <p className="text-sm uppercase tracking-[0.32em] text-violet-600 dark:text-violet-400 font-bold mb-3">Course overview</p>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{activeCourse.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-neutral-400 leading-relaxed">{activeCourse.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="rounded-3xl bg-slate-100 dark:bg-neutral-800/60 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-neutral-500 mb-3">Instructor</p>
                        <div className="flex items-center gap-3">
                          <img src={activeCourse.instructor.image} alt={activeCourse.instructor.name} className="w-12 h-12 rounded-2xl object-cover" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{activeCourse.instructor.name}</p>
                            <p className="text-xs text-slate-500 dark:text-neutral-400">{activeCourse.instructor.role}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-3xl bg-slate-100 dark:bg-neutral-800/60 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 dark:text-neutral-500 mb-3">At a glance</p>
                        <div className="space-y-3 text-sm text-slate-700 dark:text-neutral-300">
                          <div className="flex items-center justify-between"><span>Rating</span><strong>{activeCourse.rating}</strong></div>
                          <div className="flex items-center justify-between"><span>Reviews</span><strong>{activeCourse.reviews}</strong></div>
                          <div className="flex items-center justify-between"><span>Live seats</span><strong>{activeCourse.maxStudents}</strong></div>
                        </div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">What you'll learn</h3>
                    <ul className="grid gap-3 mb-8 text-sm text-slate-700 dark:text-neutral-300">
                      {activeCourse.whatYouWillLearn.slice(0, 5).map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="mt-1 shrink-0 text-violet-600 dark:text-violet-400">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Course Details</h3>
                    <div className="p-6 bg-slate-50 dark:bg-neutral-800/50 rounded-2xl border border-slate-100 dark:border-neutral-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700 dark:text-neutral-300">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Category:</strong> {activeCourse.category}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Level:</strong> {activeCourse.level}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Duration:</strong> {activeCourse.duration}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Starts:</strong> {activeCourse.startDate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Price:</strong> {activeCourse.price}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" weight="fill" />
                          <span><strong>Platform:</strong> {activeCourse.platform}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right Column: Payment Method Selection & Details */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Select Payment Method</h3>

                    {/* Tab Switcher for Local/International Payments */}
                    <div className="flex justify-center mb-6">
                      <div className="inline-flex bg-white dark:bg-neutral-900 rounded-2xl p-1.5 border border-slate-200 dark:border-neutral-800 shadow-sm">
                        {[
                          { key: 'local', label: 'Local Payments', Icon: Phone },
                          { key: 'international', label: 'International', Icon: Globe },
                        ].map(({ key, label, Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setActiveTab(key as 'local' | 'international'); setSelectedPaymentMethod(null); }}
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
                    </div>

                    <AnimatePresence mode="wait">
                      {!selectedPaymentMethod && (
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -16 }}
                          transition={{ duration: 0.35 }}
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
                            <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">
                              {activeTab === 'local' ? 'Pakistani Payment Methods' : 'International Payment Methods'}
                            </span>
                          </div>

                          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
                            {methodsToDisplay.map((method, i) => {
                              const isSelected = selectedPaymentMethod === method.id;
                              return (
                                <motion.div
                                  key={method.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                  onClick={() => setSelectedPaymentMethod(isSelected ? null : method.id)}
                                  className={`relative bg-white dark:bg-neutral-900 rounded-[24px] border-2 transition-all duration-200 cursor-pointer group overflow-hidden shadow-sm
                                    ${isSelected
                                      ? `border-violet-500 dark:border-violet-500 shadow-[0_0_0_4px_rgba(124,58,237,0.15)]`
                                      : 'border-slate-100 dark:border-neutral-800 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-100/50 dark:hover:shadow-violet-950/30'
                                    }`}
                                >
                                  {method.recommended && (
                                    <div className="absolute top-4 right-4 z-10">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wide rounded-full">
                                        <Sparkle size={10} weight="fill" />
                                        Recommended
                                      </span>
                                    </div>
                                  )}

                                  <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                    style={{ background: `radial-gradient(circle at 20% 20%, ${method.accentColor}08, transparent 60%)` }}
                                  />

                                  <div className="p-5 relative">
                                    <div className="flex items-center gap-3 mb-3">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                        <MethodLogo method={method} />
                                      </div>
                                      <div className={method.recommended ? 'pr-20' : ''}>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{method.name}</h3>
                                        <p className="text-xs text-slate-400 dark:text-neutral-500 font-medium mt-0.5">{method.tagline}</p>
                                      </div>
                                    </div>

                                    <ul className="space-y-1.5 mb-4">
                                      {method.features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-neutral-300">
                                          <CheckCircle size={12} weight="fill" className="text-emerald-500 flex-shrink-0" />
                                          {f}
                                        </li>
                                      ))}
                                    </ul>

                                    <div className="flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-50 dark:bg-neutral-800/60 rounded-xl">
                                      <Clock size={12} weight="fill" className="text-violet-500 flex-shrink-0" />
                                      <span className="text-xs text-slate-500 dark:text-neutral-400">Processing:</span>
                                      <span className="text-xs font-bold text-slate-700 dark:text-neutral-200 ml-auto">{method.processingTime}</span>
                                    </div>

                                    <motion.button
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.97 }}
                                      onClick={(e) => { e.stopPropagation(); setSelectedPaymentMethod(method.id); }}
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
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {selectedPaymentDetails && (
                        <motion.div
                          key={selectedPaymentDetails.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="mt-8 p-6 bg-white dark:bg-neutral-900 rounded-3xl border border-violet-200 dark:border-violet-800 shadow-xl"
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                                <MethodLogo method={selectedPaymentDetails} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Payment Details</p>
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">Pay via {selectedPaymentDetails.name}</h3>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentMethod(null)}
                              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-xs font-bold flex-shrink-0"
                              aria-label="Close"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="h-0.5 rounded-full mb-5" style={{ background: `linear-gradient(to right, ${selectedPaymentDetails.accentColor}, transparent)` }} />

                          {renderPaymentDetails()}

                          <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              if (!isAuthenticated) {
                                navigate('/login');
                                return;
                              }
                              try {
                                await enrollmentsService.enroll({ courseId: activeCourse.id });
                                setShowEnrollmentModal(false);
                                setSelectedPaymentMethod(null);
                                toast.success('Enrolled! Check your dashboard for details.');
                              } catch (err: unknown) {
                                const e = err as { response?: { data?: { error?: { message?: string } } } }
                                toast.error(e?.response?.data?.error?.message || 'Enrollment failed. Please try again.');
                              }
                            }}
                            className="w-full mt-6 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all text-lg flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={20} weight="fill" />
                            Complete Enrollment
                          </motion.button>

                        </motion.div>
                      )}
                    </AnimatePresence>

                    <p className="text-center text-sm text-slate-500 dark:text-neutral-400 mt-10 flex items-center justify-center gap-2">
                      <ShieldCheck size={20} className="text-emerald-500" weight="fill" />
                      Your payment information is secure and encrypted.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MOBILE STICKY BOTTOM CTA ───────────────────────────── */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-neutral-800 lg:hidden z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">{activeCourse.originalPrice}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCourse.price}</div>
              </div>
              <button
                onClick={openEnrollmentModal} // Open enrollment modal
                className="flex-1 max-w-[200px] bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] text-center text-sm">
                Enroll Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
