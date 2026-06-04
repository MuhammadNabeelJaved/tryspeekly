import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Users, Clock, GraduationCap } from '@phosphor-icons/react'
import { siteSettingsService } from '@/services/site-settings.service'
import { offersService } from '@/services/offers.service'
import type { Offer } from '@/services/offers.service'
import type { Course } from '@/types/api'
import { useGeo } from '@/context/GeoContext'
import { getDiscountedPrice } from '@/utils/offerUtils'

const FOCUS_LABEL: Record<string, string> = {
  speaking: 'Speaking',
  grammar: 'Grammar',
  ielts: 'IELTS Prep',
  business: 'Business English',
  general: 'General English',
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop',
]

function formatPrice(course: Course): string {
  if (!course.price || course.price === 0) return 'Free'
  if (course.currency === 'USD') return `$${course.priceUSD ?? course.price}`
  return `PKR ${course.price.toLocaleString()}`
}

function formatDuration(course: Course): string {
  const sessions = course.totalSessions ?? 0
  const mins = course.sessionDuration ?? 0
  if (sessions && mins) return `${sessions} sessions · ${mins} min`
  if (sessions) return `${sessions} sessions`
  if (mins) return `${mins} min/session`
  return 'Flexible'
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 flex flex-col animate-pulse">
      <div className="h-52 bg-slate-200 dark:bg-neutral-800 flex-shrink-0" />
      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex justify-between gap-3">
          <div className="h-5 bg-slate-200 dark:bg-neutral-800 rounded-lg flex-1" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-neutral-800 rounded-lg flex-shrink-0" />
        </div>
        <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded-lg w-3/4" />
        <div className="h-4 bg-slate-100 dark:bg-neutral-800 rounded-lg w-1/2" />
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-neutral-800 flex gap-4">
          <div className="h-4 w-20 bg-slate-100 dark:bg-neutral-800 rounded-lg" />
          <div className="h-4 w-24 bg-slate-100 dark:bg-neutral-800 rounded-lg" />
        </div>
        <div className="h-11 bg-slate-200 dark:bg-neutral-800 rounded-2xl mt-2" />
      </div>
    </div>
  )
}

export default function HomeCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [skeletonCount, setSkeletonCount] = useState(3)
  const [activeOffers, setActiveOffers] = useState<Offer[]>([])
  const { currency } = useGeo()

  useEffect(() => {
    const load = async () => {
      try {
        try {
          const settings = await siteSettingsService.get()
          setSkeletonCount(settings.homepage?.courseCount ?? 3)
        } catch {
          // keep default skeleton count
        }
        const data = await siteSettingsService.getFeaturedCourses()
        setCourses(Array.isArray(data) ? data : [])
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let mounted = true
    offersService.getActiveOffers()
      .then(r => { if (mounted && r.success) setActiveOffers(r.data) })
      .catch(() => {})
    return () => { mounted = false }
  }, [])

  return (
    <section className="py-20 lg:py-28 bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
            >
              <GraduationCap size={18} weight="fill" /> Explore Programs
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight"
            >
              Featured{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                Courses
              </span>
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              View All Courses <ArrowRight size={18} weight="bold" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {loading
            ? Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)
            : courses.length === 0
            ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <GraduationCap size={48} className="text-slate-300 dark:text-neutral-700 mb-4" />
                <p className="text-slate-500 dark:text-neutral-400 font-semibold">No courses available yet.</p>
                <p className="text-slate-400 dark:text-neutral-500 text-sm mt-1">Check back soon!</p>
              </div>
            )
            : courses.map((course, idx) => {
              const image = course.thumbnail ?? PLACEHOLDER_IMAGES[idx % PLACEHOLDER_IMAGES.length]
              const label = FOCUS_LABEL[course.focus] ?? course.focus
              const studentCount = Array.isArray(course.enrolledStudents)
                ? course.enrolledStudents.length
                : 0

              return (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.35 }}
                  className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-2xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-400 flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden flex-shrink-0">
                    <img
                      src={image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent" />

                    {/* Top badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-3 py-1 bg-white/95 backdrop-blur-sm text-violet-600 text-[11px] font-bold rounded-lg">
                        {label}
                      </span>
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-600 text-[11px] font-bold rounded-lg capitalize">
                        {course.level}
                      </span>
                    </div>

                    {/* Bottom overlay row */}
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                        <Star size={14} weight="fill" className="text-yellow-400" />
                        <span>4.8</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white text-xs font-semibold">
                        <Users size={14} weight="fill" />
                        <span>{studentCount.toLocaleString()} learners</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {(() => {
                        const priceSuffix = course.pricingType === 'monthly' ? '/mo' : course.pricingType === 'per_session' ? '/session' : ''
                        if (currency === 'PKR' && course.price) {
                          const result = getDiscountedPrice(course._id, course.price, activeOffers)
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
                              Rs.{course.price.toLocaleString()}{priceSuffix}
                            </span>
                          )
                        }
                        return (
                          <span className="flex-shrink-0 text-xl font-black text-violet-600 dark:text-violet-400">
                            {course.priceUSD !== undefined ? `$${course.priceUSD}${priceSuffix}` : formatPrice(course)}
                          </span>
                        )
                      })()}
                    </div>

                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-5 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100 dark:border-neutral-800 mt-auto">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                        <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                          <GraduationCap size={14} />
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap capitalize">{course.level}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                        <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                          <Clock size={14} />
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap">{formatDuration(course)}</span>
                      </div>
                    </div>

                    <Link to={`/courses/${course._id}`} className="block mt-auto">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3.5 rounded-2xl transition-all hover:bg-violet-600 dark:hover:bg-violet-500 dark:hover:text-white text-sm"
                      >
                        View Details <ArrowRight size={18} weight="bold" />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              )
            })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center md:hidden"
        >
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-900 dark:text-white font-bold py-3.5 px-8 rounded-2xl transition-all text-sm w-full"
          >
            View All Courses <ArrowRight size={18} weight="bold" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
