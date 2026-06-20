import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useAnimationFrame, type Variants } from 'framer-motion'
import { ArrowRight, Play, Star } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'

// ─── Variants ──────────────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&q=80',
]

// ─── Scroll card data ───────────────────────────────────────────────────────────

type ImageCard = { type: 'image'; src: string; label: string; tag: string }
type StatCard  = { type: 'stat';  icon: string; value: string; label: string }
type BadgeCard = { type: 'badge'; text: string; sub: string }
type Card = ImageCard | StatCard | BadgeCard

const ROW_A: Card[] = [
  { type: 'image', src: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=320&q=80', label: 'IELTS Prep', tag: 'Exam Ready' },
  { type: 'stat',  icon: '🎓', value: '10,000+', label: 'Students Enrolled' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=320&q=80', label: 'Business English', tag: 'Professional' },
  { type: 'badge', text: '4.9 ★', sub: 'Average Rating' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=320&q=80', label: 'Speaking Practice', tag: 'Live Sessions' },
  { type: 'stat',  icon: '🏆', value: '95%', label: 'Success Rate' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=320&q=80', label: 'Expert Teachers', tag: 'Certified' },
  { type: 'stat',  icon: '📚', value: '50+', label: 'Courses Available' },
]

const ROW_B: Card[] = [
  { type: 'badge', text: '25+ yrs', sub: 'of Excellence' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=320&q=80', label: 'Grammar Mastery', tag: 'Foundation' },
  { type: 'stat',  icon: '🌍', value: '100+', label: 'Countries Reached' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=320&q=80', label: 'Vocabulary', tag: 'Word Power' },
  { type: 'badge', text: 'Zoom ✓', sub: 'Google Meet ✓' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=320&q=80', label: 'Online Classes', tag: 'Flexible Hours' },
  { type: 'stat',  icon: '👨‍🏫', value: '25+', label: 'Expert Instructors' },
  { type: 'image', src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=320&q=80', label: 'Conversation', tag: 'Fluency Focus' },
]

// ─── ScrollCard ─────────────────────────────────────────────────────────────────

function ScrollCard({ card }: { card: Card }) {
  if (card.type === 'image') {
    return (
      <div className="relative h-36 w-56 rounded-2xl overflow-hidden shadow-lg">
        <img src={card.src} alt={card.label} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3.5 right-3.5">
          <span className="block text-[10px] font-semibold text-white/70 uppercase tracking-wider mb-0.5">
            {card.tag}
          </span>
          <span className="block text-[14px] font-bold text-white leading-tight">{card.label}</span>
        </div>
      </div>
    )
  }

  if (card.type === 'stat') {
    return (
      <div className="h-36 w-44 rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm shadow-lg border border-white/60 dark:border-neutral-700/50 flex flex-col items-center justify-center gap-1.5 px-3">
        <span className="text-3xl leading-none">{card.icon}</span>
        <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{card.value}</p>
        <p className="text-[12px] text-slate-500 dark:text-neutral-400 text-center leading-tight">{card.label}</p>
      </div>
    )
  }

  return (
    <div className="h-36 w-44 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg flex flex-col items-center justify-center gap-2 px-3">
      <p className="text-2xl font-black text-white leading-tight text-center">{card.text}</p>
      <p className="text-[12px] text-violet-200 text-center leading-tight">{card.sub}</p>
    </div>
  )
}

// ─── ScrollRow ──────────────────────────────────────────────────────────────────

function ScrollRow({ cards, direction }: { cards: Card[]; direction: 'left' | 'right' }) {
  const doubled = [...cards, ...cards]
  const xPx = useMotionValue(0)
  const rowRef = useRef<HTMLDivElement>(null)
  const isPaused = useRef(false)

  // For 'right' direction start at -half so scrolling rightward toward 0 is seamless
  useEffect(() => {
    if (direction === 'right' && rowRef.current) {
      xPx.set(-rowRef.current.scrollWidth / 2)
    }
  }, [direction, xPx])

  useAnimationFrame((_, delta) => {
    if (isPaused.current || !rowRef.current) return
    const half = rowRef.current.scrollWidth / 2
    if (!half) return
    const pxPerMs = half / 45000 // 45 s per loop
    if (direction === 'left') {
      const next = xPx.get() - pxPerMs * delta
      xPx.set(next <= -half ? next + half : next)
    } else {
      const next = xPx.get() + pxPerMs * delta
      xPx.set(next >= 0 ? next - half : next)
    }
  })

  return (
    <div
      className="overflow-hidden w-full"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%)',
      }}
      onMouseEnter={() => { isPaused.current = true }}
      onMouseLeave={() => { isPaused.current = false }}
    >
      <motion.div
        ref={rowRef}
        style={{ x: xPx }}
        className="flex gap-4 w-max pt-4 pb-2"
      >
        {doubled.map((card, i) => (
          <div key={i} className="flex-shrink-0">
            <ScrollCard card={card} />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Hero ───────────────────────────────────────────────────────────────────────

export default function Hero() {
  const navigate = useNavigate()

  return (
    <section className="relative bg-white dark:bg-neutral-950 min-h-[100dvh] overflow-x-hidden transition-colors duration-300">

      {/* ── Content ── */}
      <div className="flex flex-col min-h-[100dvh] pt-[72px] md:pt-[80px]">

        {/* Centered text */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center space-y-7 max-w-3xl w-full"
          >

            {/* Label */}
            <motion.div variants={itemVariants} className="flex items-center gap-3 justify-center">
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span className="text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wide uppercase">
                Your Gateway to Abroad
              </span>
              <span className="w-6 h-[2px] bg-violet-600 dark:bg-violet-400 rounded-full" />
            </motion.div>

            {/* Headline — rendered immediately (LCP element, no initial hide) */}
            <h1 className="text-5xl sm:text-6xl xl:text-[68px] font-black text-slate-900 dark:text-white leading-[1.0] tracking-tight">
              TrySpeekly Unlocks
              <br />
              All the Doors{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                to Abroad.
              </span>
            </h1>

            {/* Exam types pill row */}
            <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-2">
              {['IELTS', 'PTE', 'TOEFL', 'OET', 'LangCert', 'Cambridge English', 'Duolingo', 'SOP Writing', 'Interview Prep'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-slate-600 dark:text-neutral-300 text-lg leading-relaxed max-w-[500px] mx-auto"
            >
              We ensure no hurdle comes between your dream study destination and you. Our team turns your worries into our responsibilities.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <motion.button
                type="button"
                onClick={() => navigate('/contact')}
                whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all"
              >
                Book Free Consultation
                <ArrowRight size={18} weight="bold" />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => navigate('/courses')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-3 text-slate-700 dark:text-neutral-200 font-semibold px-8 py-4 rounded-2xl border border-slate-200 dark:border-neutral-700 hover:border-violet-300 dark:hover:border-violet-600 bg-white/70 dark:bg-white/5 backdrop-blur-sm transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center text-violet-600 dark:text-violet-400">
                  <Play size={13} weight="fill" className="ml-0.5" />
                </span>
                Browse Courses
              </motion.button>
            </motion.div>

            {/* Social proof */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap items-center gap-5 justify-center"
            >
              <div className="flex -space-x-2.5">
                {AVATARS.map(src => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="w-9 h-9 rounded-full border-2 border-white dark:border-neutral-950 object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={12} weight="fill" className="text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 dark:text-neutral-400">
                  {'4.9 · 10,000+ students'}
                </p>
              </div>

              <div className="hidden sm:block w-px h-10 bg-slate-300 dark:bg-neutral-700" />

              <div className="text-left">
                <p className="text-base font-black text-slate-900 dark:text-white">95%</p>
                <p className="text-sm text-slate-600 dark:text-neutral-400">Success rate</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Scroll card rows ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.7 }}
          className="pb-8 pt-2 space-y-2 overflow-visible"
        >
          <ScrollRow cards={ROW_A} direction="left" />
          <ScrollRow cards={ROW_B} direction="right" />
        </motion.div>

      </div>
    </section>
  )
}
