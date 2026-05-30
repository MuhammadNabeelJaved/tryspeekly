import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, ArrowRight, ChalkboardTeacher } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { axiosClient } from '@/lib/axiosClient'

interface Teacher {
  _id: string
  name: string
  bio?: string
  jobTitle?: string
  profileImage?: string
  country?: string
  city?: string
}

export default function HomeInstructors() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    axiosClient
      .get('/users/home-instructors')
      .then((res) => {
        const data = res.data?.data ?? res.data
        if (Array.isArray(data)) setTeachers(data)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  if (!loaded || teachers.length === 0) return null

  return (
    <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-semibold mb-4"
            >
              <ChalkboardTeacher size={16} weight="fill" />
              Meet Your Instructors
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight"
            >
              Learn from the{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                best experts
              </span>
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/instructors"
              className="inline-flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 hover:gap-3 transition-all"
            >
              View all instructors <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.09 }}
              className="group relative bg-slate-50 dark:bg-neutral-800/60 border border-slate-100 dark:border-neutral-700 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Photo */}
              <div className="relative h-56 overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30">
                {t.profileImage ? (
                  <img
                    src={t.profileImage}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl font-black text-violet-300 dark:text-violet-700">
                      {t.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

                {/* Rating badge */}
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <Star size={12} weight="fill" className="text-yellow-400" />
                  4.9
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className="text-base font-black text-slate-900 dark:text-white mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {t.name}
                </h3>
                <p className="text-violet-600 dark:text-violet-400 text-xs font-semibold mb-3">
                  {t.jobTitle ?? 'English Instructor'}
                </p>
                {t.bio && (
                  <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed line-clamp-2">
                    {t.bio}
                  </p>
                )}
                {(t.city || t.country) && (
                  <p className="text-xs text-slate-400 dark:text-neutral-500 mt-3">
                    {[t.city, t.country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
