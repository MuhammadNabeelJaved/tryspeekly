import { motion } from 'framer-motion'
import { Clock, Star, Users, GraduationCap, ArrowRight, MagnifyingGlass, Funnel } from '@phosphor-icons/react'
import { useState } from 'react'

const CATEGORIES = ['All', 'General English', 'IELTS Prep', 'Business English', 'Kids & Teens', 'Speaking']

const COURSES = [
  {
    id: 1,
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
    id: 2,
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
    id: 3,
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
    id: 4,
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
    id: 5,
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
    id: 6,
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

export default function Courses() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCourses = COURSES.filter(course => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <section id="courses" className="bg-slate-50 dark:bg-slate-950 py-20 lg:py-32 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16 lg:mb-24">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-bold tracking-wider uppercase mb-4"
          >
            <GraduationCap size={20} weight="fill" />
            Our Academic Programs
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
          >
            Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">English Courses</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Whether you're a beginner or looking to perfect your business communication, we have the right course for your goals.
          </motion.p>
        </div>

        {/* Filters & Search */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-md w-full">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
        >
          {filteredCourses.map((course, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={course.id}
              className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-2xl hover:shadow-violet-600/10 transition-all duration-500"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shadow-sm">
                    {course.category}
                  </span>
                  {course.popular && (
                    <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-violet-600/30">
                      Popular
                    </span>
                  )}
                </div>
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Star size={16} weight="fill" className="text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Users size={16} weight="fill" className="text-violet-400" />
                    <span>{course.students} Learners</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {course.title}
                  </h3>
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-400">
                    {course.price}
                  </span>
                </div>
                
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  {course.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Level</p>
                      <p className="text-xs font-bold">{course.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Duration</p>
                      <p className="text-xs font-bold">{course.duration}</p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ gap: '12px' }}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl transition-all hover:bg-violet-600 dark:hover:bg-violet-400 dark:hover:text-white"
                >
                  Enroll Now
                  <ArrowRight size={20} weight="bold" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full mb-6">
              <Funnel size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No courses found</h3>
            <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filters.</p>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-purple-700 text-white relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Not sure which course is right for you?</h3>
            <p className="text-violet-100 max-w-xl">
              Get a free assessment and consultation with our expert instructors to find the perfect learning path for your goals.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative z-10 bg-white text-violet-600 font-black px-10 py-5 rounded-2xl shadow-xl shadow-black/20 whitespace-nowrap"
          >
            Free Assessment
          </motion.button>
          
          {/* Abstract Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl -ml-24 -mb-24" />
        </motion.div>
      </div>
    </section>
  )
}
