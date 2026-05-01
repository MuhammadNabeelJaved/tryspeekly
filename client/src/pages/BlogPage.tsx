import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  MagnifyingGlass, CalendarBlank, Clock, ArrowRight, 
  Article, TrendUp, EnvelopeSimple, BookmarkSimple, Funnel
} from '@phosphor-icons/react'

const CATEGORIES = ['All', 'Study Tips', 'Grammar', 'IELTS Prep', 'Vocabulary', 'Career']

const FEATURED_POST = {
  id: 1,
  title: '10 Proven Strategies to Achieve a Band 8 in IELTS Speaking',
  excerpt: 'Discover the exact techniques, vocabulary structures, and mindset shifts you need to impress examiners and score an 8.0+ in your IELTS speaking test.',
  category: 'IELTS Prep',
  readTime: '8 min read',
  date: 'May 12, 2026',
  image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop',
  author: {
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    role: 'IELTS Examiner'
  }
}

const POSTS = [
  {
    id: 2,
    title: 'Mastering the Perfect Tenses: A Complete Guide',
    excerpt: 'Stop confusing Present Perfect and Past Simple. This guide breaks down English perfect tenses with real-world examples.',
    category: 'Grammar',
    readTime: '6 min read',
    date: 'May 08, 2026',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop'
    }
  },
  {
    id: 3,
    title: 'Business English: 50 Phrases for Professional Emails',
    excerpt: 'Sound more professional at work with these essential email phrases for negotiating, apologizing, and following up.',
    category: 'Career',
    readTime: '5 min read',
    date: 'May 05, 2026',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'Mark Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
    }
  },
  {
    id: 4,
    title: 'How to Learn English Passively While Watching Netflix',
    excerpt: 'Turn your binge-watching sessions into productive language learning time with the active-passive observation method.',
    category: 'Study Tips',
    readTime: '4 min read',
    date: 'April 28, 2026',
    image: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'Emily Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop'
    }
  },
  {
    id: 5,
    title: 'Phrasal Verbs: The Secret to Sounding Like a Native',
    excerpt: 'Native speakers use phrasal verbs constantly. Here are the top 20 you need to know to sound natural in casual conversations.',
    category: 'Vocabulary',
    readTime: '7 min read',
    date: 'April 22, 2026',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'Michael Brown',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop'
    }
  },
  {
    id: 6,
    title: 'Common Pronunciation Mistakes and How to Fix Them',
    excerpt: 'Are you mispronouncing these everyday words? Learn the correct tongue placement and stress patterns.',
    category: 'Study Tips',
    readTime: '5 min read',
    date: 'April 15, 2026',
    image: 'https://images.unsplash.com/photo-1475721027187-402ad2989a3b?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'Emily Chen',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop'
    }
  },
  {
    id: 7,
    title: 'IELTS Writing Task 2: Structuring Your Essay',
    excerpt: 'A foolproof template for organizing your thoughts and writing a high-scoring essay under time pressure.',
    category: 'IELTS Prep',
    readTime: '9 min read',
    date: 'April 10, 2026',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    author: {
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
    }
  }
]

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Scroll to top on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  })

  const filteredPosts = POSTS.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="bg-slate-50 dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] selection:bg-violet-200 dark:selection:bg-violet-900/50">
      
      {/* ─── HERO SECTION ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white dark:bg-neutral-900 py-16 lg:py-24 border-b border-slate-100 dark:border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(circle,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100/60 dark:bg-violet-900/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 text-sm font-semibold mb-6"
            >
              <Article size={16} weight="fill" />
              EnglishPro Blog
            </motion.span>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight mb-6"
            >
              Insights to master your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400">
                Language Skills
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-500 dark:text-neutral-400 leading-relaxed mb-8"
            >
              Discover study tips, grammar guides, vocabulary hacks, and expert advice to accelerate your journey to English fluency.
            </motion.p>
          </div>
        </div>
      </section>

      {/* ─── FEATURED POST ──────────────────────────────────────── */}
      {(activeCategory === 'All' && !searchQuery) && (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="group relative bg-white dark:bg-neutral-900 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-neutral-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-violet-600/10 transition-all duration-500 cursor-pointer grid lg:grid-cols-2"
            >
              {/* Image Side */}
              <div className="relative h-64 sm:h-80 lg:h-full overflow-hidden">
                <img 
                  src={FEATURED_POST.image} 
                  alt={FEATURED_POST.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-6 left-6 lg:hidden">
                  <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-lg">
                    {FEATURED_POST.category}
                  </span>
                </div>
              </div>

              {/* Content Side */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="hidden lg:flex items-center gap-3 mb-6">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                    <TrendUp size={14} weight="bold" /> Trending
                  </span>
                  <span className="text-sm font-bold text-slate-400 dark:text-neutral-500">
                    {FEATURED_POST.category}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  <Link to={`/blog/${FEATURED_POST.id}`} className="hover:underline decoration-violet-500/30 underline-offset-4">
                    {FEATURED_POST.title}
                  </Link>
                </h2>
                
                <p className="text-slate-500 dark:text-neutral-400 text-lg leading-relaxed mb-8 flex-1">
                  {FEATURED_POST.excerpt}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <img src={FEATURED_POST.author.avatar} alt={FEATURED_POST.author.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{FEATURED_POST.author.name}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">{FEATURED_POST.date}</div>
                    </div>
                  </div>
                  <Link to={`/blog/${FEATURED_POST.id}`} className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400">
                    Read Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ─── FILTERS & GRID ─────────────────────────────────────── */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-12">
            
            {/* Category Pills */}
            <div className="w-full lg:flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2 min-w-max pb-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
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
            <div className="relative group w-full lg:w-80 flex-shrink-0">
              <MagnifyingGlass 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" 
                size={18} 
                weight="bold"
              />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-600/20 focus:border-violet-600 transition-all text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>
          </div>

          {/* Posts Grid */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, idx) => (
                <motion.article
                  layout
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="group flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-xl hover:shadow-violet-600/5 hover:-translate-y-1 transition-all duration-400 cursor-pointer"
                >
                  <div className="relative h-56 overflow-hidden flex-shrink-0">
                    <Link to={`/blog/${post.id}`}>
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shadow-sm">
                        {post.category}
                      </span>
                    </div>
                    <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                      <BookmarkSimple size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-neutral-500 mb-3">
                      <div className="flex items-center gap-1.5"><CalendarBlank size={14} /> {post.date}</div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                      <div className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime}</div>
                    </div>

                    <Link to={`/blog/${post.id}`}>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-3 pt-5 border-t border-slate-50 dark:border-neutral-800/50 mt-auto">
                      <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-sm font-bold text-slate-700 dark:text-neutral-300">{post.author.name}</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {filteredPosts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 border border-slate-200 dark:border-neutral-800 border-dashed rounded-3xl"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-neutral-900 rounded-full mb-6">
                <Funnel size={28} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No articles found</h3>
              <p className="text-slate-500 dark:text-neutral-400 mb-6">We couldn't find any articles matching your search.</p>
              <button 
                onClick={() => { setActiveCategory('All'); setSearchQuery('') }}
                className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold rounded-2xl shadow-md transition-all hover:shadow-lg"
              >
                Clear all filters
              </button>
            </motion.div>
          )}

          {/* Pagination / Load More */}
          {filteredPosts.length > 0 && (
            <div className="mt-16 text-center">
              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center px-8 py-4 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 font-semibold rounded-2xl hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-white/5 transition-all"
              >
                Load More Articles
              </motion.button>
            </div>
          )}
        </div>
      </section>

      {/* ─── NEWSLETTER CTA ─────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-white dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30 rounded-[2.5rem] p-10 md:p-16 shadow-lg shadow-violet-600/5 relative overflow-hidden"
          >
            {/* Background Decorations */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm text-violet-600 dark:text-violet-400 mb-8">
                <EnvelopeSimple size={32} weight="fill" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">Never miss an update</h2>
              <p className="text-slate-500 dark:text-neutral-400 text-lg mb-10 max-w-xl mx-auto">
                Get the latest study tips, grammar guides, and course announcements delivered straight to your inbox every week.
              </p>
              
              <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="flex-1 px-5 py-4 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 transition-all font-medium"
                  required
                />
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all whitespace-nowrap"
                >
                  Subscribe
                </motion.button>
              </form>
              <p className="text-xs text-slate-400 dark:text-neutral-500 mt-4">We care about your data in our <a href="#" className="underline hover:text-violet-600">privacy policy</a>.</p>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}