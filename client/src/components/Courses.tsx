import { motion, AnimatePresence, useInView, animate } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Clock, Star, Users, GraduationCap, ArrowRight, MagnifyingGlass,
  BookOpen, Trophy, Lightning, ChatCircle, Globe, Medal,
  CaretDown, CheckCircle, Funnel, UserCircle,
  LinkedinLogo, TwitterLogo, InstagramLogo, YoutubeLogo, FacebookLogo
} from '@phosphor-icons/react'
import { useState, useEffect, useRef } from 'react'
import { coursesService } from '../services/courses.service'
import { useGeo } from '../context/GeoContext'
import { offersService } from '../services/offers.service'
import type { Offer } from '../services/offers.service'
import { getDiscountedPrice } from '../utils/offerUtils'
import { usersService } from '../services/users.service'
import type { User } from '../types/api'

// Animated Counter Component
function AnimatedCounter({ from, to, duration = 1.5, format }: { from: number, to: number, duration?: number, format?: (val: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  useEffect(() => {
    if (inView) {
      const controls = animate(from, to, {
        duration,
        ease: "easeOut",
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = formatRef.current ? formatRef.current(value) : Math.floor(value).toString();
          }
        }
      });
      return () => controls.stop();
    }
  }, [from, to, duration, inView]);

  return <span ref={ref}>{format ? format(from) : from}</span>;
}

const CATEGORIES = ['All', 'General English', 'IELTS Prep', 'Business English', 'Kids & Teens', 'Speaking']

// Map backend focus -> frontend category
const FOCUS_TO_CATEGORY: Record<string, string> = {
  speaking: 'Speaking',
  grammar: 'General English',
  ielts: 'IELTS Prep',
  business: 'Business English',
  general: 'General English',
}

// Default images per category — shown when a course has no uploaded thumbnail
const CATEGORY_DEFAULT_IMAGE: Record<string, string> = {
  'General English':   'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
  'Speaking':          'https://images.unsplash.com/photo-1475721027187-402ad2989a3b?q=80&w=800&auto=format&fit=crop',
  'Grammar':           'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
  'IELTS Prep':        'https://images.unsplash.com/photo-1544650030-3c51ad04fe0b?q=80&w=800&auto=format&fit=crop',
  'Business English':  'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
  'Kids & Teens':      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
}
const DEFAULT_COURSE_IMAGE = CATEGORY_DEFAULT_IMAGE['General English']

export interface CourseCard {
  id: string
  title: string
  category: string
  description: string
  level: string
  duration: string
  rating: number
  students: number
  image: string | undefined
  price: string
  pricePKR?: number
  priceUSD?: number
  pricingType?: 'monthly' | 'full_course' | 'per_session'
  popular: boolean
}

// Fallback hardcoded courses when API is unavailable
export const FALLBACK_COURSES: CourseCard[] = [
  {
    id: '1',
    title: 'General English Mastery',
    category: 'General English',
    description: 'Master the fundamentals of English grammar, vocabulary, and daily conversation.',
    level: 'Beginner to Advanced',
    duration: '12 Weeks',
    rating: 4.9,
    students: 1250,
    image: 'https://images.unsplash.com/photo-1544650030-3c51ad04fe0b?q=80&w=800&auto=format&fit=crop',
    price: '$199',
    popular: true
  },
  {
    id: '2',
    title: 'IELTS Academic Success',
    category: 'IELTS Prep',
    description: 'Get ready for the IELTS exam with intensive practice in all four modules.',
    level: 'Intermediate+',
    duration: '8 Weeks',
    rating: 4.8,
    students: 850,
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    price: '$249',
    popular: true
  },
  {
    id: '3',
    title: 'Business Communication',
    category: 'Business English',
    description: 'Enhance your professional career with advanced business English skills.',
    level: 'Upper-Intermediate',
    duration: '10 Weeks',
    rating: 4.7,
    students: 640,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    price: '$299',
    popular: false
  },
  {
    id: '4',
    title: 'English for Young Learners',
    category: 'Kids & Teens',
    description: 'Fun and interactive English lessons designed specifically for children.',
    level: 'Beginner',
    duration: '16 Weeks',
    rating: 4.9,
    students: 450,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
    price: '$159',
    popular: false
  },
  {
    id: '5',
    title: 'Advanced Speaking Skills',
    category: 'Speaking',
    description: 'Focus on pronunciation, fluency, and natural expression in various contexts.',
    level: 'Intermediate to Advanced',
    duration: '6 Weeks',
    rating: 4.8,
    students: 920,
    image: 'https://images.unsplash.com/photo-1475721027187-402ad2989a3b?q=80&w=800&auto=format&fit=crop',
    price: '$179',
    popular: true
  },
  {
    id: '6',
    title: 'Grammar & Writing Clinic',
    category: 'General English',
    description: 'Perfect your written English and understand complex grammar structures.',
    level: 'All Levels',
    duration: '8 Weeks',
    rating: 4.6,
    students: 580,
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    price: '$149',
    popular: false
  }
]

const BASE_STATS = [
  { value: 6000, suffix: '+', isFloat: false, label: 'Active Students', icon: Users },
  { value: 4.9, suffix: '', isFloat: true, label: 'Avg. Rating', icon: Star },
  { value: 95, suffix: '%', isFloat: false, label: 'Success Rate', icon: Trophy },
]

const FEATURES = [
  {
    icon: Lightning,
    title: 'Live Interactive Classes',
    desc: 'Real-time sessions with expert teachers — ask questions, get instant feedback, and learn faster.'
  },
  {
    icon: Globe,
    title: 'Learn from Anywhere',
    desc: 'Access your course on any device, anytime. All sessions are recorded for flexible replay.'
  },
  {
    icon: Medal,
    title: 'Certified Achievement',
    desc: 'Earn internationally recognized certificates that employers and universities respect.'
  },
  {
    icon: ChatCircle,
    title: 'Dedicated 1-on-1 Support',
    desc: 'Personal coaching and support from your instructor throughout your entire journey.'
  },
]


const LEARNING_PATHS = [
  {
    step: '01',
    level: 'A1 – A2',
    label: 'Foundation',
    colorClass: 'from-emerald-500 to-teal-500',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    textClass: 'text-emerald-600 dark:text-emerald-400',
    desc: 'Build a solid base with core grammar, essential vocabulary, and everyday conversations.',
    courses: ['General English Mastery', 'English for Young Learners'],
  },
  {
    step: '02',
    level: 'B1 – B2',
    label: 'Intermediate',
    colorClass: 'from-violet-500 to-purple-500',
    bgClass: 'bg-violet-50 dark:bg-violet-950/30',
    borderClass: 'border-violet-200 dark:border-violet-800',
    textClass: 'text-violet-600 dark:text-violet-400',
    desc: 'Expand your confidence with professional English, fluency training, and complex topics.',
    courses: ['Business Communication', 'Advanced Speaking Skills'],
  },
  {
    step: '03',
    level: 'C1 – C2',
    label: 'Advanced',
    colorClass: 'from-amber-500 to-orange-500',
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-600 dark:text-amber-400',
    desc: 'Achieve mastery with IELTS exam prep, advanced academic writing, and native-level fluency.',
    courses: ['IELTS Academic Success', 'Grammar & Writing Clinic'],
  },
]

const FAQS = [
  {
    q: 'How are the classes conducted?',
    a: 'All classes are held online via Zoom with live interaction. Sessions are recorded, so you can rewatch them anytime. You also get access to practice materials, assignments, and a course portal.'
  },
  {
    q: 'Do you offer a free trial before I commit?',
    a: 'Yes! We offer a free 60-minute introductory session for all new students. This lets you meet your teacher, experience our teaching style, and decide if the course is right for you — no payment needed.'
  },
  {
    q: 'What equipment do I need to join?',
    a: 'Just a computer or smartphone with a stable internet connection, a microphone, and ideally a webcam. No special software is required — we\'ll send you a Zoom link before each session.'
  },
  {
    q: 'Can I switch or upgrade my course later?',
    a: 'Absolutely. You can switch or upgrade at any time. We\'ll credit your remaining balance toward your new course enrollment with no penalties.'
  },
  {
    q: 'How long do I have access to course materials?',
    a: 'You get lifetime access to all recorded sessions, worksheets, practice exercises, and course resources. Even after your live sessions end, your materials stay with you forever.'
  },
]

function HeroCard({ course }: { course: CourseCard }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-lg">
          {course.category}
        </span>
        <div className="flex items-center gap-1.5">
          <Star size={16} weight="fill" className="text-yellow-400" />
          <span className="text-slate-700 dark:text-neutral-200 text-sm font-bold">{course.rating}</span>
        </div>
      </div>
      <h4 className="text-slate-900 dark:text-white font-bold text-lg leading-snug mb-4">{course.title}</h4>
      <div className="flex items-center gap-5 text-slate-500 dark:text-neutral-400 text-sm">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>{course.students.toLocaleString()} learners</span>
        </div>
      </div>
    </>
  )
}

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [cardsHovered, setCardsHovered] = useState(false)
  const [apiCourses, setApiCourses] = useState<CourseCard[] | null>(null)
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])
  const [instructors, setInstructors] = useState<User[]>([])
  const { currency } = useGeo()
  const navigate = useNavigate()

  const scrollToCourseGrid = () => {
    document.getElementById('courses-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch courses from the API on mount
  useEffect(() => {
    let mounted = true
    const fetchCourses = async () => {
      try {
        const response = await coursesService.getAllCourses({ status: 'published' })
        if (!mounted) return
        const mapped: CourseCard[] = response.data.map((course) => ({
          id: course._id,
          title: course.title,
          category: FOCUS_TO_CATEGORY[course.focus] || 'General English',
          description: course.description,
          level: course.level.charAt(0).toUpperCase() + course.level.slice(1),
          duration: `${course.totalSessions} sessions`,
          rating: 4.8,
          students: course.enrolledStudents?.length || 0,
          image: course.thumbnail || undefined,
          price: '',
          pricePKR: course.price,
          priceUSD: course.priceUSD,
          pricingType: course.pricingType,
          popular: false,
        }))
        setApiCourses(mapped)
      } catch {
        toast.error('Could not load courses from server — showing sample courses.')
      }
    }
    fetchCourses()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    offersService.getActiveOffers()
      .then(r => { if (mounted && r.success) setActiveOffers(r.data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    let mounted = true
    usersService.getCoursesInstructors()
      .then(data => { if (mounted) setInstructors(data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  const courses = apiCourses || FALLBACK_COURSES
  const courseCount = apiCourses?.length ?? 20

  const stats = [
    BASE_STATS[0],
    { value: courseCount, suffix: '+', isFloat: false, label: 'Expert Courses', icon: BookOpen },
    BASE_STATS[1],
    BASE_STATS[2],
  ]

  const filteredCourses = courses.filter(course => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div id="courses" className="bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 min-h-[calc(100dvh-80px)] flex items-center py-12 lg:py-0">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />

        {/* Violet blob */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-violet-100/60 dark:bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-20">

            {/* ── Left column ── */}
            <div className="flex-1 lg:max-w-[55%]">

              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold mb-6"
              >
                <GraduationCap size={16} weight="fill" />
                {courseCount}+ Expert Courses
              </motion.div>

              {/* Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tight mb-6"
              >
                Explore Our English{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                  Courses
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-slate-500 dark:text-neutral-400 text-lg max-w-lg leading-relaxed mb-8"
              >
                From beginner basics to IELTS mastery — expert-led courses designed
                to get you speaking confidently, faster.
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-10"
              >
                <motion.button
                  type="button"
                  onClick={scrollToCourseGrid}
                  whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all"
                >
                  Browse Courses <ArrowRight size={20} weight="bold" />
                </motion.button>
              </motion.div>

              {/* Stats strip */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-wrap items-center gap-x-8 gap-y-3"
              >
                {stats.map(({ value, suffix, isFloat, label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon size={15} weight="fill" className="text-violet-500" />
                    <span className="text-slate-900 dark:text-white font-black text-sm">
                      <AnimatedCounter 
                        from={0} 
                        to={value} 
                        duration={2} 
                        format={(val) => 
                          isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString('en-US')
                        } 
                      />
                      {suffix}
                    </span>
                    <span className="text-slate-400 dark:text-neutral-500 text-xs">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Right column — floating cards ── */}
            <div className="hidden lg:flex flex-1 items-center justify-center pt-8 lg:pt-0">
              <motion.div
                animate={{ y: cardsHovered ? 0 : [0, -12, 0] }}
                transition={cardsHovered
                  ? { duration: 0.4, ease: 'easeOut' }
                  : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
                }
                onMouseEnter={() => setCardsHovered(true)}
                onMouseLeave={() => setCardsHovered(false)}
                className="relative w-[400px] h-[300px] cursor-pointer"
              >
                {/* Card 5 (Top Left) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={cardsHovered
                    ? { x: -240, y: -40, rotate: -15, opacity: 1, scale: 0.95 }
                    : { x: -60, y: 40, rotate: -10, opacity: 0.3, scale: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="absolute top-0 left-0 w-[380px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-sm p-7 z-0"
                >
                  <HeroCard course={FALLBACK_COURSES[4]} />
                </motion.div>

                {/* Card 4 (Top Right) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={cardsHovered
                    ? { x: 240, y: -40, rotate: 15, opacity: 1, scale: 0.95 }
                    : { x: 50, y: 35, rotate: 8, opacity: 0.4, scale: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="absolute top-0 left-0 w-[380px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-sm p-7 z-[5]"
                >
                  <HeroCard course={FALLBACK_COURSES[3]} />
                </motion.div>

                {/* Card 3 (Bottom Left) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={cardsHovered
                    ? { x: -140, y: 150, rotate: -5, opacity: 1, scale: 0.95 }
                    : { x: -30, y: 20, rotate: -5, opacity: 0.6, scale: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="absolute top-0 left-0 w-[380px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-md p-7 z-10"
                >
                  <HeroCard course={FALLBACK_COURSES[0]} />
                </motion.div>

                {/* Card 2 (Bottom Right) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={cardsHovered
                    ? { x: 140, y: 150, rotate: 5, opacity: 1, scale: 0.95 }
                    : { x: 25, y: 10, rotate: 4, opacity: 0.8, scale: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="absolute top-0 left-0 w-[380px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-lg p-7 z-20"
                >
                  <HeroCard course={FALLBACK_COURSES[2]} />
                </motion.div>

                {/* Card 1 (Center Front) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={cardsHovered
                    ? { x: 0, y: 50, rotate: 0, opacity: 1, scale: 1 }
                    : { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }
                  }
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="absolute top-0 left-0 w-[380px] bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl shadow-2xl p-7 z-30"
                >
                  <HeroCard course={FALLBACK_COURSES[1]} />
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FALLBACK_COURSES GRID ─────────────────────────────────────── */}
      <section id="courses-grid" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filter row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-12">

            {/* Category pills — fixed horizontal scroll */}
            <div className="w-full lg:flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2 min-w-max">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                        : 'bg-white dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative group w-full lg:w-72 flex-shrink-0">
              <MagnifyingGlass
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors"
                size={18}
              />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all text-slate-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Result count */}
          {filteredCourses.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-neutral-500 mb-8">
              Showing <span className="font-semibold text-slate-700 dark:text-neutral-300">{filteredCourses.length}</span> course{filteredCourses.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && <> in <span className="font-semibold text-violet-600 dark:text-violet-400">{activeCategory}</span></>}
            </p>
          )}

          {/* Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, idx) => (
                <motion.div
                  layout
                  key={course.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-2xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-400"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={course.image || CATEGORY_DEFAULT_IMAGE[course.category] || DEFAULT_COURSE_IMAGE}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={e => { (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGE[course.category] || DEFAULT_COURSE_IMAGE }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-violet-600 text-[11px] font-bold rounded-lg">
                        {course.category}
                      </span>
                      {course.popular && (
                        <span className="px-3 py-1 bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-violet-600/40">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay row */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                        <Star size={14} weight="fill" className="text-yellow-400" />
                        <span>{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                        <Users size={14} weight="fill" />
                        <span>{course.students.toLocaleString()} learners</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {course.title}
                      </h3>
                      {(() => {
                        const priceSuffix = course.pricingType === 'monthly' ? '/mo' : course.pricingType === 'per_session' ? '/session' : ''
                        if (currency === 'PKR' && course.pricePKR !== undefined) {
                          const result = getDiscountedPrice(course.id, course.pricePKR, activeOffers)
                          if (result.hasDiscount) {
                            return (
                              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-1.5 py-0.5 rounded-md">
                                    {result.discountLabel}
                                  </span>
                                  <span className="text-xl font-black text-violet-600 dark:text-violet-400">
                                    Rs.{result.discountedPrice.toLocaleString()}{priceSuffix}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 line-through">
                                  Rs.{result.originalPrice.toLocaleString()}{priceSuffix}
                                </span>
                              </div>
                            )
                          }
                          return (
                            <span className="flex-shrink-0 text-xl font-black text-violet-600 dark:text-violet-400">
                              Rs.{(course.pricePKR ?? 0).toLocaleString()}{priceSuffix}
                            </span>
                          )
                        }
                        return (
                          <span className="flex-shrink-0 text-xl font-black text-violet-600 dark:text-violet-400">
                            {course.priceUSD !== undefined ? `$${course.priceUSD}${priceSuffix}` : course.price}
                          </span>
                        )
                      })()}
                    </div>

                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-5 line-clamp-4">
                      {course.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                        <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                          <GraduationCap size={14} />
                        </div>
                        <span className="text-xs font-semibold">{course.level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                        <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                          <Clock size={14} />
                        </div>
                        <span className="text-xs font-semibold">{course.duration}</span>
                      </div>
                    </div>

                    <Link to={`/courses/${course.id}`} className="block">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3.5 rounded-2xl transition-all hover:bg-violet-600 dark:hover:bg-violet-500 dark:hover:text-white text-sm"
                      >
                        Enroll Now <ArrowRight size={18} weight="bold" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {filteredCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-neutral-900 rounded-full mb-6">
                <Funnel size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
              <p className="text-slate-500 dark:text-neutral-400 mb-6">Try adjusting your search or category filters.</p>
              <button
                onClick={() => { setActiveCategory('All'); setSearchQuery('') }}
                className="px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-full hover:bg-violet-500 transition-colors"
              >
                Clear filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── LEARNING PATHS ───────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
            >
              <GraduationCap size={18} weight="fill" /> Your Journey
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight"
            >
              A Clear Path to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                Fluency
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 dark:text-neutral-400 text-lg max-w-xl mx-auto"
            >
              No matter where you start, we guide you step by step to English confidence.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {LEARNING_PATHS.map((path, i) => (
              <motion.div
                key={path.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative z-10 rounded-3xl border p-8 ${path.bgClass} ${path.borderClass}`}
              >
                {/* Step number */}
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${path.colorClass} text-white text-lg font-black mb-6 shadow-lg`}>
                  {path.step}
                </div>

                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${path.textClass}`}>
                  {path.level}
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
                  {path.label}
                </h3>
                <p className="text-slate-600 dark:text-neutral-400 text-sm leading-relaxed mb-6">
                  {path.desc}
                </p>

                <div className="space-y-2">
                  {path.courses.map(c => (
                    <div key={c} className="flex items-center gap-2.5 text-slate-700 dark:text-neutral-300 text-sm">
                      <CheckCircle size={16} weight="fill" className={path.textClass} />
                      <span className="font-medium">{c}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: text */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
              >
                <Trophy size={18} weight="fill" /> Why We're Different
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight"
              >
                Everything You Need to Succeed
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 dark:text-neutral-400 text-lg leading-relaxed"
              >
                We combine expert teaching, flexible learning, and real accountability to help you reach your English goals — guaranteed.
              </motion.p>
            </div>

            {/* Right: feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl p-6 hover:shadow-lg hover:shadow-violet-600/5 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600/10 dark:bg-violet-600/20 mb-4">
                    <Icon size={22} weight="fill" className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h4>
                  <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── INSTRUCTORS ──────────────────────────────────────── */}
      {instructors.length > 0 && (
        <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center mb-16">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
              >
                <Globe size={18} weight="fill" /> Meet the Team
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight"
              >
                Learn from the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                  Best Instructors
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-slate-500 dark:text-neutral-400 text-lg max-w-xl mx-auto"
              >
                Our teachers are certified experts with years of real-world teaching experience.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {instructors.map((ins, i) => (
                <motion.div
                  key={ins._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="group bg-slate-50 dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-400"
                >
                  {/* Photo */}
                  <div className="relative h-64 overflow-hidden bg-slate-100 dark:bg-neutral-800">
                    {ins.photo ? (
                      <img
                        src={ins.photo}
                        alt={ins.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserCircle size={80} className="text-slate-300 dark:text-neutral-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                    {ins.jobTitle && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-violet-600 text-xs font-bold rounded-lg">
                          {ins.jobTitle}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{ins.name}</h3>
                    {ins.jobTitle && (
                      <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold mb-3">{ins.jobTitle}</p>
                    )}
                    {ins.bio && (
                      <p className="text-slate-500 dark:text-neutral-400 text-xs leading-relaxed line-clamp-3 mb-4">{ins.bio}</p>
                    )}
                    {/* Social links — only render icons that have a URL */}
                    {ins.socialLinks && (() => {
                      const links = [
                        { url: ins.socialLinks.linkedin,  Icon: LinkedinLogo,  label: 'LinkedIn' },
                        { url: ins.socialLinks.twitter,   Icon: TwitterLogo,   label: 'Twitter' },
                        { url: ins.socialLinks.instagram, Icon: InstagramLogo, label: 'Instagram' },
                        { url: ins.socialLinks.youtube,   Icon: YoutubeLogo,   label: 'YouTube' },
                        { url: ins.socialLinks.facebook,  Icon: FacebookLogo,  label: 'Facebook' },
                      ].filter(l => l.url)
                      if (!links.length) return null
                      return (
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          {links.map(({ url, Icon, label }) => (
                            <a
                              key={label}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={label}
                              className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-900/40 flex items-center justify-center text-slate-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            >
                              <Icon size={16} weight="fill" />
                            </a>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
            >
              <ChatCircle size={18} weight="fill" /> FAQs
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight"
            >
              Common Questions
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-slate-500 dark:text-neutral-400 text-lg"
            >
              Everything you need to know before enrolling.
            </motion.p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-slate-900 dark:text-white font-semibold text-base pr-4">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex-shrink-0 text-slate-400 dark:text-neutral-500"
                  >
                    <CaretDown size={20} weight="bold" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-slate-500 dark:text-neutral-400 text-sm leading-relaxed border-t border-slate-100 dark:border-neutral-800 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 text-white p-10 md:p-16"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
              <div className="max-w-xl">
                <h3 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
                  Not sure which course is right for you?
                </h3>
                <p className="text-violet-200 text-lg leading-relaxed">
                  Get a free consultation with our expert instructors and discover the perfect learning path for your goals.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <motion.button
                  onClick={() => navigate('/contact')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-violet-700 font-black px-10 py-4 rounded-2xl shadow-xl shadow-black/20 hover:bg-violet-50 transition-colors"
                >
                  Free Assessment
                </motion.button>
                <motion.button
                  onClick={() => navigate('/contact')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="border-2 border-white/30 text-white font-bold px-10 py-4 rounded-2xl hover:border-white/60 hover:bg-white/5 transition-colors"
                >
                  Talk to Us
                </motion.button>
              </div>
            </div>

            {/* Decorations */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl -ml-32 -mb-32" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-violet-400/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

    </div>
  )
}
