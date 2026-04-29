import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Brain,
  BookOpen,
  GraduationCap,
  ChartLineUp,
  Users,
  Microphone,
} from '@phosphor-icons/react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { stiffness: 80, damping: 20 },
  },
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={cardVariants}
      className={`bg-white border border-slate-200 rounded-2xl p-7 hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

function IconWrapper({
  children,
  bg,
  border,
}: {
  children: React.ReactNode
  bg: string
  border: string
}) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg} border ${border}`}>
      {children}
    </div>
  )
}

function AIChat() {
  const messages = [
    { role: 'ai', text: 'Tell me about your last vacation.' },
    { role: 'user', text: 'Last year I go to Japan...' },
    { role: 'ai', text: '"Went" is the past form. Try: "Last year I went to Japan."' },
  ]

  return (
    <div className="mt-5 space-y-2.5">
      {messages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: msg.role === 'ai' ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.45 + 0.5, stiffness: 100, damping: 22 }}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'ai'
                ? 'bg-slate-100 text-slate-700 rounded-tl-sm'
                : 'bg-blue-600 text-white rounded-tr-sm'
            }`}
          >
            {msg.text}
          </div>
        </motion.div>
      ))}
      <motion.div
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: 2.2 }}
        className="flex gap-1 px-3.5"
      >
        {[0, 0.2, 0.4].map((delay, i) => (
          <motion.span
            key={i}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
            className="w-1.5 h-1.5 bg-blue-500 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  )
}

function LevelPath() {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const active = 2

  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {levels.map((lvl, i) => (
        <motion.span
          key={lvl}
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 + 0.3, stiffness: 200, damping: 15 }}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
            i < active
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : i === active
              ? 'bg-blue-600 text-white border-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
              : 'bg-slate-50 text-slate-400 border-slate-200'
          }`}
        >
          {lvl}
        </motion.span>
      ))}
    </div>
  )
}

function ProgressBars() {
  const bars = [42, 58, 74, 51, 88, 67, 93]

  return (
    <div className="mt-5 flex items-end gap-1.5 h-16">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.08 + 0.4, stiffness: 100, damping: 20 }}
          style={{ height: `${h}%`, transformOrigin: 'bottom' }}
          className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm"
        />
      ))}
    </div>
  )
}

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" className="bg-slate-50 py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16">
          <span className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-4 block">
            The Platform
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] max-w-lg">
            Everything you need to become fluent
          </h2>
        </div>

        {/* Asymmetric 5-column grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 md:grid-cols-5 gap-5"
        >
          {/* Row 1 */}
          <Card className="md:col-span-3">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-blue-50" border="border-blue-100">
                <Brain size={20} weight="duotone" className="text-blue-600" />
              </IconWrapper>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Practice Partner</h3>
                <p className="text-xs text-slate-500">Corrects mistakes in real-time</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Practice real conversations any time. The AI responds naturally and explains errors in context — not from a textbook.
            </p>
            <AIChat />
          </Card>

          <Card className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-emerald-50" border="border-emerald-100">
                <BookOpen size={18} weight="duotone" className="text-emerald-600" />
              </IconWrapper>
              <h3 className="text-base font-bold text-slate-900">Structured Path</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              From your first word to business fluency. Every step sequenced, tested, and personalized.
            </p>
            <LevelPath />
          </Card>

          {/* Row 2 */}
          <Card className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-amber-50" border="border-amber-100">
                <GraduationCap size={18} weight="duotone" className="text-amber-600" />
              </IconWrapper>
              <h3 className="text-base font-bold text-slate-900">Recognized Certificates</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Verified by 1,200+ employers globally. Share directly to LinkedIn with one click.
            </p>
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap size={16} weight="fill" className="text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">B2 Certificate</p>
                <p className="text-[10px] text-slate-400">Issued · April 2026</p>
              </div>
            </div>
          </Card>

          <Card className="md:col-span-3">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-violet-50" border="border-violet-100">
                <ChartLineUp size={20} weight="duotone" className="text-violet-600" />
              </IconWrapper>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Progress Analytics</h3>
                <p className="text-xs text-slate-500">Weekly insights on every skill</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              See exactly where you are, what you've mastered, and which lessons to focus on next.
            </p>
            <ProgressBars />
            <div className="mt-3 flex gap-6 text-xs text-slate-500">
              <span><span className="text-slate-800 font-semibold">+23%</span> last month</span>
              <span><span className="text-slate-800 font-semibold">8.4h</span> avg/week</span>
              <span><span className="text-slate-800 font-semibold">B1</span> current level</span>
            </div>
          </Card>

          {/* Row 3 */}
          <Card className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-rose-50" border="border-rose-100">
                <Users size={18} weight="duotone" className="text-rose-600" />
              </IconWrapper>
              <h3 className="text-base font-bold text-slate-900">Live Group Sessions</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              6-person live sessions 3x weekly with native English teachers.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {[11, 33, 55].map((seed) => (
                  <img
                    key={seed}
                    src={`https://picsum.photos/seed/live${seed}/48/48`}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">4 spots left today</span>
            </div>
          </Card>

          <Card className="md:col-span-3">
            <div className="flex items-center gap-3 mb-3">
              <IconWrapper bg="bg-cyan-50" border="border-cyan-100">
                <Microphone size={18} weight="duotone" className="text-cyan-600" />
              </IconWrapper>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pronunciation Coach</h3>
                <p className="text-xs text-slate-500">Phoneme-level feedback in seconds</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Record yourself speaking. Get a breakdown of every phoneme, stress pattern, and intonation mark instantly.
            </p>
            <div className="mt-4 flex items-end gap-1 h-10">
              {[60, 80, 40, 90, 70, 55, 85, 65, 75, 50].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, h / 50, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                  style={{ transformOrigin: 'center', height: `${h * 0.38}px` }}
                  className="flex-1 bg-cyan-400 rounded-full opacity-70"
                />
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
