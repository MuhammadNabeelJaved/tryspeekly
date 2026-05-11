import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, Users, Clock, GraduationCap } from '@phosphor-icons/react'
import { FALLBACK_COURSES } from './Courses' // Importing from the Courses component

export default function HomeCourses() {
  // Take only the first 3 courses to show on the landing page
  const featuredCourses = FALLBACK_COURSES.slice(0, 3)

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
          {featuredCourses.map((course, idx) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.35 }}
              className="group bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-2xl hover:shadow-violet-600/8 hover:-translate-y-1 transition-all duration-400 flex flex-col"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  <span className="flex-shrink-0 text-xl font-black text-violet-600 dark:text-violet-400">
                    {course.price}
                  </span>
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
                    <span className="text-xs font-semibold whitespace-nowrap">{course.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                    <div className="p-1.5 bg-slate-100 dark:bg-neutral-800 rounded-lg">
                      <Clock size={14} />
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap">{course.duration}</span>
                  </div>
                </div>

                <Link to={`/courses/${course.id}`} className="block mt-auto">
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
          ))}
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