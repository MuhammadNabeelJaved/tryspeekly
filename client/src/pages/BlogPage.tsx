import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  MagnifyingGlass, CalendarBlank, Clock, ArrowRight,
  Article, TrendUp, EnvelopeSimple, BookmarkSimple, Funnel
} from '@phosphor-icons/react'
import { blogService } from '../services/blog.service'
import type { Blog } from '../types/api'
import { extractApiError } from '../utils/apiError'

const CATEGORIES = ['All', 'Study Tips', 'Grammar', 'IELTS Prep', 'Vocabulary', 'Career']

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { email: '' }
  })

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true)
      try {
        const params: any = { status: 'published' }
        if (activeCategory !== 'All') params.tag = activeCategory
        if (searchQuery) params.search = searchQuery
        
        const response = await blogService.getAllBlogs(params)
        setBlogs(response.data)
      } catch (error: unknown) {
        toast.error(extractApiError(error, 'Failed to load blog posts.'))
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchBlogs, 300)
    return () => clearTimeout(timer)
  }, [activeCategory, searchQuery])

  const onSubmit = (data: { email: string }) => {
    toast.success(`Subscribed! We'll send updates to ${data.email}`)
    reset()
  }

  // Scroll to top on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])

  const featuredPost = blogs[0]
  const otherPosts = blogs.slice(1)

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
      {loading ? (
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-[400px] rounded-[2rem] bg-white dark:bg-neutral-900 animate-pulse border border-slate-100 dark:border-neutral-800" />
          </div>
        </section>
      ) : (blogs.length > 0 && activeCategory === 'All' && !searchQuery) && (
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
                  src={featuredPost.coverImage || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop'} 
                  alt={featuredPost.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:hidden" />
                <div className="absolute top-6 left-6 lg:hidden">
                  <span className="px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider shadow-lg">
                    {featuredPost.tags[0] || 'English'}
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
                    {featuredPost.tags[0]}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  <Link to={`/blog/slug/${featuredPost.slug}`} className="hover:underline decoration-violet-500/30 underline-offset-4">
                    {featuredPost.title}
                  </Link>
                </h2>
                
                <p className="text-slate-500 dark:text-neutral-400 text-lg leading-relaxed mb-8 flex-1">
                  {featuredPost.excerpt}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-black text-violet-600 dark:text-violet-400">
                      {featuredPost.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{featuredPost.author.name}</div>
                      <div className="text-xs text-slate-500 dark:text-neutral-400">
                        {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <Link to={`/blog/slug/${featuredPost.slug}`} className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400">
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
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-96 rounded-3xl bg-white dark:bg-neutral-900 animate-pulse border border-slate-100 dark:border-neutral-800" />
                ))
              ) : (
                (activeCategory === 'All' && !searchQuery ? otherPosts : blogs).map((post, idx) => (
                <motion.article
                  layout
                  key={post._id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="group flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-xl hover:shadow-violet-600/5 hover:-translate-y-1 transition-all duration-400 cursor-pointer"
                >
                  <div className="relative h-56 overflow-hidden flex-shrink-0">
                    <Link to={`/blog/slug/${post.slug}`}>
                      <img 
                        src={post.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop'} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </Link>
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shadow-sm">
                        {post.tags[0] || 'English'}
                      </span>
                    </div>
                    <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                      <BookmarkSimple size={16} weight="bold" />
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-neutral-500 mb-3">
                      <div className="flex items-center gap-1.5"><CalendarBlank size={14} /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB')}</div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                      <div className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</div>
                    </div>

                    <Link to={`/blog/slug/${post.slug}`}>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    
                    <p className="text-slate-500 dark:text-neutral-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center gap-3 pt-5 border-t border-slate-50 dark:border-neutral-800/50 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xs font-black text-violet-600 dark:text-violet-400">
                        {post.author.name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-neutral-300">{post.author.name}</span>
                    </div>
                  </div>
                </motion.article>
              )))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {!loading && blogs.length === 0 && (
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
          {!loading && blogs.length > 0 && (
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
              
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <div className="flex-1">
                  <input 
                    type="email" 
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                    })}
                    placeholder="Enter your email address" 
                    className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/50 transition-all font-medium"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1 text-left">{errors.email.message as string}</p>}
                </div>
                <motion.button 
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: '0 16px 40px rgba(124,58,237,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_28px_rgba(124,58,237,0.35)] transition-all whitespace-nowrap h-[58px]"
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