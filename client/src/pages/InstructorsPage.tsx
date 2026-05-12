import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, Globe, Play, TwitterLogo, LinkedinLogo, Certificate, ChalkboardTeacher, ChatCircle } from '@phosphor-icons/react'
import { axiosClient } from '../lib/axiosClient'

interface Instructor {
  name: string
  role: string
  experience: string
  students: string
  rating: number
  specialty: string
  image: string
  bio: string
  social: { twitter: string; linkedin: string }
}

const FALLBACK_INSTRUCTORS: Instructor[] = [
  {
    name: 'Sarah Johnson',
    role: 'IELTS Expert & Trainer',
    experience: '8 Years',
    students: '1,200+',
    rating: 4.9,
    specialty: 'IELTS Prep',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
    bio: 'Former IELTS examiner with a passion for helping students achieve their target band scores.',
    social: { twitter: '#', linkedin: '#' }
  },
  {
    name: 'Mark Williams',
    role: 'Business English Coach',
    experience: '12 Years',
    students: '890+',
    rating: 4.8,
    specialty: 'Business English',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
    bio: 'Specializes in corporate communication, negotiation skills, and professional email writing.',
    social: { twitter: '#', linkedin: '#' }
  },
  {
    name: 'Emily Chen',
    role: 'General English Specialist',
    experience: '6 Years',
    students: '2,100+',
    rating: 5.0,
    specialty: 'General English',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
    bio: 'Creates engaging, interactive lessons focused on everyday conversation and confidence building.',
    social: { twitter: '#', linkedin: '#' }
  },
  {
    name: 'Michael Brown',
    role: 'Pronunciation Coach',
    experience: '10 Years',
    students: '1,500+',
    rating: 4.9,
    specialty: 'Speaking',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
    bio: 'Expert in accent reduction and natural rhythm, helping you sound more like a native speaker.',
    social: { twitter: '#', linkedin: '#' }
  },
  {
    name: 'Lisa Davies',
    role: 'Kids & Teens Educator',
    experience: '7 Years',
    students: '3,000+',
    rating: 4.8,
    specialty: 'Young Learners',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    bio: 'Uses games, songs, and storytelling to make English learning fun and memorable for children.',
    social: { twitter: '#', linkedin: '#' }
  },
  {
    name: 'David Wilson',
    role: 'Advanced Grammar Tutor',
    experience: '15 Years',
    students: '1,800+',
    rating: 4.9,
    specialty: 'Grammar',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop',
    bio: 'Breaks down complex grammar rules into simple, understandable concepts for advanced learners.',
    social: { twitter: '#', linkedin: '#' }
  }
]

const FEATURES = [
  {
    icon: Certificate,
    title: 'Certified Professionals',
    desc: 'All our instructors hold CELTA, TEFL, or TESOL certifications from recognized institutions.'
  },
  {
    icon: Globe,
    title: 'Native-level Fluency',
    desc: 'Learn the natural flow, idioms, and cultural nuances from top-tier language experts.'
  },
  {
    icon: ChalkboardTeacher,
    title: 'Experienced Educators',
    desc: 'With an average of 8+ years of teaching experience, they know how to get results.'
  }
]

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>(FALLBACK_INSTRUCTORS)

  useEffect(() => {
    axiosClient
      .get('/users', { params: { role: 'teacher' } })
      .then((res) => {
        const data = res.data?.data ?? res.data
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Instructor[] = data.map((t: any) => ({
            name: t.name,
            role: t.bio ?? 'English Instructor',
            experience: `${t.experience ?? 5}+ Years`,
            students: `${t.studentCount ?? 500}+`,
            rating: t.rating ?? 4.9,
            specialty: (t.specializations ?? ['General English'])[0],
            image: t.photo ?? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
            bio: t.bio ?? 'Experienced English instructor dedicated to your success.',
            social: { twitter: '#', linkedin: '#' },
          }))
          setInstructors(mapped)
        }
      })
      .catch(() => {
        // Keep fallback data on failure
      })
  }, [])

  const pageVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  }

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px]"
    >
      {/* ─── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 py-16 lg:py-24">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        {/* Violet blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/60 dark:bg-violet-900/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div variants={sectionVariants} className="max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold mb-6">
              <ChalkboardTeacher size={16} weight="fill" />
              World-Class Educators
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
              Learn from the <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                Best in the Industry
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-neutral-400 leading-relaxed mb-8">
              Our instructors aren't just teachers; they are language coaches dedicated to your success. With years of experience and proven methodologies, they make learning English engaging, effective, and fun.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── WHY OUR INSTRUCTORS ──────────────────────────────── */}
      <section className="py-12 border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 flex-shrink-0">
                  <feature.icon size={24} weight="fill" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSTRUCTORS GRID ─────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((ins, i) => (
              <motion.div
                key={ins.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-400 flex flex-col"
              >
                {/* Photo Header */}
                <div className="relative h-64 overflow-hidden flex-shrink-0">
                  <img
                    src={ins.image}
                    alt={ins.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-violet-600 text-xs font-bold rounded-lg shadow-sm">
                      {ins.specialty}
                    </span>
                  </div>
                  
                  {/* Bottom Info inside image */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white text-sm font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                      <Star size={14} weight="fill" className="text-yellow-400" />
                      {ins.rating}
                    </div>
                    <div className="flex gap-2">
                      <a href={ins.social.twitter} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-violet-600 transition-colors">
                        <TwitterLogo size={16} weight="fill" />
                      </a>
                      <a href={ins.social.linkedin} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-violet-600 transition-colors">
                        <LinkedinLogo size={16} weight="fill" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{ins.name}</h3>
                  <p className="text-violet-600 dark:text-violet-400 text-sm font-semibold mb-4">{ins.role}</p>
                  
                  <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-6 flex-1">
                    {ins.bio}
                  </p>

                  <div className="flex items-center gap-4 pt-5 border-t border-slate-100 dark:border-neutral-800 mb-5">
                    <div className="flex-1 text-center">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{ins.students}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider mt-0.5">Students</div>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-neutral-700" />
                    <div className="flex-1 text-center">
                      <div className="text-lg font-black text-slate-900 dark:text-white">{ins.experience}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium uppercase tracking-wider mt-0.5">Experience</div>
                    </div>
                  </div>

                  <button className="w-full py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 text-slate-900 dark:text-white font-bold text-sm hover:bg-violet-600 hover:text-white dark:hover:bg-violet-500 transition-colors flex items-center justify-center gap-2">
                    <Play size={16} weight="fill" /> Watch Intro
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-10 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 p-10 lg:p-14 rounded-[2.5rem] border border-violet-100 dark:border-violet-900/30"
          >
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-violet-600 text-white mb-6 shadow-lg shadow-violet-600/30">
                <ChatCircle size={24} weight="fill" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Want to book a 1-on-1 session?</h2>
              <p className="text-slate-500 dark:text-neutral-400 text-lg">
                Schedule a free 15-minute consultation with any of our instructors to discuss your learning goals.
              </p>
            </div>
            <div className="flex-shrink-0">
              <motion.button 
                whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all whitespace-nowrap"
              >
                Find Your Match
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  )
}
