import { motion } from 'framer-motion'
import { CheckCircle, Users, Trophy, Target, Heart, Globe, Play } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import SEOMeta from '@/components/SEOMeta'

export default function AboutPage() {
  const navigate = useNavigate()

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
      <SEOMeta slug="about" fallbackTitle="About Us — TrySpeekly" fallbackDescription="Learn about TrySpeekly, our mission, and our team of expert English instructors." />
      {/* ─── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 py-16 lg:py-24">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        {/* Violet blob */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/60 dark:bg-violet-900/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={sectionVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold mb-6">
                <Users size={16} weight="fill" />
                About TrySpeekly
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6">
                Empowering the world to speak with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                  Confidence
                </span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-neutral-400 leading-relaxed mb-8">
                We believe that language should never be a barrier. Our mission is to provide accessible, high-quality English education that helps individuals achieve their personal and professional dreams.
              </p>
              
              <div className="flex items-center gap-6">
                <div className="flex -space-x-4">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-900" alt="Student" />
                  <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-900" alt="Student" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-900" alt="Student" />
                  <div className="w-12 h-12 rounded-full border-2 border-white dark:border-neutral-900 bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                    10k+
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                  Join <span className="font-bold text-slate-900 dark:text-white">10,000+</span> happy students
                </div>
              </div>
            </motion.div>

            <motion.div variants={sectionVariants} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
                <img 
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop" 
                  alt="Students studying together" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-violet-900/10 mix-blend-multiply" />
                <button
                  onClick={() => navigate('/courses')}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-violet-600 hover:scale-110 hover:bg-white transition-all shadow-xl"
                >
                  <Play size={32} weight="fill" />
                </button>
              </div>
              
              {/* Floating stat card */}
              <div className="absolute -bottom-8 -left-8 bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-xl border border-slate-100 dark:border-neutral-700 max-w-[200px] hidden md:block">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Trophy size={20} weight="fill" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">95%</div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-neutral-400 font-medium">Success rate in IELTS exams</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CORE VALUES ────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Our Core Values</h2>
            <p className="text-lg text-slate-500 dark:text-neutral-400">
              Everything we do is guided by these principles, ensuring you get the best learning experience possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "Excellence", desc: "We strive for excellence in every lesson, delivering curriculum designed by leading linguistic experts." },
              { icon: Heart, title: "Empathy", desc: "Learning a language is hard. We provide a supportive, judgment-free environment for everyone." },
              { icon: Globe, title: "Accessibility", desc: "Education is a right, not a privilege. We build tools that make learning accessible to global audiences." }
            ].map((val, i) => (
              <motion.div 
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-slate-100 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-6">
                  <val.icon size={28} weight="fill" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{val.title}</h3>
                <p className="text-slate-500 dark:text-neutral-400 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OUR STORY ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 border-y border-slate-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-6 text-slate-500 dark:text-neutral-400 text-lg leading-relaxed">
                <p>
                  TrySpeekly started in 2018 with a simple idea: learning English shouldn't be boring, rigid, or restricted to traditional classrooms. 
                </p>
                <p>
                  Our founders, a group of passionate educators and tech enthusiasts, realized that the best way to learn a language is through active conversation, personalized feedback, and engaging content.
                </p>
                <p>
                  Today, we've grown into a global community of learners and expert instructors. We continually innovate our platform to provide interactive live classes, comprehensive materials, and the support you need to succeed.
                </p>
              </div>
              <ul className="mt-8 space-y-4">
                {[
                  "Over 5 years of educational excellence",
                  "Award-winning curriculum design",
                  "Certified native-level instructors"
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-700 dark:text-neutral-300 font-medium">
                    <CheckCircle size={24} weight="fill" className="text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-4 pt-12">
                <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=600&auto=format&fit=crop" className="rounded-3xl shadow-lg w-full h-64 object-cover" alt="Student learning" />
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" className="rounded-3xl shadow-lg w-full h-48 object-cover" alt="Teacher explaining" />
              </div>
              <div className="space-y-4">
                <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=600&auto=format&fit=crop" className="rounded-3xl shadow-lg w-full h-48 object-cover" alt="Group study" />
                <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=600&auto=format&fit=crop" className="rounded-3xl shadow-lg w-full h-64 object-cover" alt="Online class" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-[2.5rem] p-12 md:p-16 text-white shadow-2xl relative overflow-hidden"
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">Ready to join our community?</h2>
              <p className="text-violet-100 text-lg md:text-xl max-w-2xl mx-auto">
                Start your journey towards English fluency today with our expert instructors and proven methodology.
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  )
}
