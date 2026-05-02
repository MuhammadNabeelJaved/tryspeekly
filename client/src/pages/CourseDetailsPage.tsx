import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Star, Users, Clock, GraduationCap, CheckCircle, 
  PlayCircle, Certificate, FileText, CaretDown, 
  ArrowLeft, Sparkle,
  ChartBar, Tag, Chats, CaretLeft, CaretRight, ThumbsUp,
  Calendar, VideoCamera, UsersThree, ChalkboardTeacher, Laptop
} from '@phosphor-icons/react'

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

export default function CourseDetailsPage() {
  const [openModule, setOpenModule] = useState<number | null>(0)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [currentReviewPage, setCurrentReviewPage] = useState(1)

  const totalReviewPages = Math.ceil(COURSE.reviewsList.length / REVIEWS_PER_PAGE)
  const currentReviews = COURSE.reviewsList.slice(
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
                  {COURSE.category}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 tracking-tight text-white drop-shadow-sm">
                {COURSE.title}
              </h1>
              
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed mb-8 max-w-2xl font-light">
                {COURSE.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">
                    <Star size={16} weight="fill" />
                    <span className="text-base">{COURSE.rating}</span>
                  </div>
                  <button onClick={() => {
                    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })
                  }} className="text-slate-300 border-b border-slate-600 border-dashed pb-0.5 cursor-pointer hover:text-white transition-colors">
                    ({COURSE.reviews.toLocaleString()} reviews)
                  </button>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <UsersThree size={18} className="text-violet-400" />
                  <span><strong>Max {COURSE.maxStudents}</strong> per cohort</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar size={18} className="text-emerald-400" />
                  <span>Starts: <strong>{COURSE.startDate}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <VideoCamera size={18} className="text-blue-400" />
                  <span>{COURSE.platform}</span>
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
                <img src={COURSE.videoPreview} alt="Course preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-500" />
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
                  {COURSE.whatYouWillLearn.map((item, i) => (
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
                      {COURSE.schedule} • {COURSE.duration}
                    </p>
                  </div>
                  <button className="text-sm font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors bg-violet-50 dark:bg-violet-900/20 px-4 py-2 rounded-lg">
                    Expand All
                  </button>
                </div>

                <div className="space-y-4">
                  {COURSE.curriculum.map((module, i) => (
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
                      src={COURSE.instructor.image} 
                      alt={COURSE.instructor.name} 
                      className="relative w-36 h-36 rounded-full object-cover border-4 border-white dark:border-neutral-900 shadow-xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-950 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star size={12} weight="fill" /> {COURSE.instructor.rating}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 transition-colors">{COURSE.instructor.name}</h3>
                    <p className="text-violet-600 dark:text-violet-400 font-bold text-sm mb-5 uppercase tracking-wider">{COURSE.instructor.role}</p>
                    
                    <div className="flex flex-wrap gap-5 mb-5 pb-5 border-b border-slate-100 dark:border-neutral-800">
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300 font-semibold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                          <Users size={16} weight="fill" />
                        </div>
                        {COURSE.instructor.students} Students
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300 font-semibold">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-500 dark:text-neutral-400">
                          <PlayCircle size={16} weight="fill" />
                        </div>
                        {COURSE.instructor.courses} Courses
                      </div>
                    </div>
                    
                    <p className="text-slate-600 dark:text-neutral-400 text-base leading-relaxed italic border-l-4 border-violet-200 dark:border-violet-900/50 pl-4">
                      "{COURSE.instructor.bio}"
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
                          <Star key={s} size={18} weight={s <= Math.floor(COURSE.rating) ? "fill" : "regular"} />
                        ))}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{COURSE.rating} Course Rating</span>
                      <span className="text-slate-400 dark:text-neutral-500">•</span>
                      <span className="text-slate-500 dark:text-neutral-400">{COURSE.reviews.toLocaleString()} reviews</span>
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
                  <img src={COURSE.videoPreview} alt="Course preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-70" />
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
                      <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{COURSE.price}</span>
                      <span className="text-lg text-slate-400 dark:text-neutral-500 line-through mb-1 font-semibold">{COURSE.originalPrice}</span>
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
                        { icon: UsersThree, text: `Intimate cohort (Max ${COURSE.maxStudents})` },
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
                      <span className="font-bold text-slate-900 dark:text-white">{COURSE.level}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-neutral-800 pb-3">
                      <span className="text-slate-500 dark:text-neutral-400">Platform</span>
                      <span className="font-bold text-slate-900 dark:text-white">{COURSE.platform}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-neutral-800 pb-3">
                      <span className="text-slate-500 dark:text-neutral-400">Starts</span>
                      <span className="font-bold text-slate-900 dark:text-white">{COURSE.startDate}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-neutral-400">Language</span>
                      <span className="font-bold text-slate-900 dark:text-white">{COURSE.language}</span>
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
                <div className="text-xs text-slate-500 dark:text-neutral-400 font-bold mb-0.5 line-through">{COURSE.originalPrice}</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{COURSE.price}</div>
              </div>
              <button className="flex-1 max-w-[200px] bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] text-center text-sm">
                Enroll Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}