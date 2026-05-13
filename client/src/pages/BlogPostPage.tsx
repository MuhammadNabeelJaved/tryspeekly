import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, CalendarBlank, Clock, 
  TwitterLogo, LinkedinLogo, FacebookLogo, Link as LinkIcon,
  BookmarkSimple, CheckCircle, ArrowRight
} from '@phosphor-icons/react'
import { blogService } from '../services/blog.service'
import type { Blog } from '../types/api'
import Loader from '@/components/Loader'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [related, setRelated] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchBlog = async () => {
      if (!slug) return
      setLoading(true)
      try {
        const response = await blogService.getBlogBySlug(slug)
        setBlog(response.data)
        
        // Fetch related posts (same tag)
        if (response.data.tags.length > 0) {
          const relatedResponse = await blogService.getAllBlogs({ 
            tag: response.data.tags[0],
            limit: 3
          })
          setRelated(relatedResponse.data.filter(b => b._id !== response.data._id))
        }
      } catch (error) {
        console.error('Failed to fetch blog post', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlog()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [slug])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="pt-32"><Loader /></div>
  if (!blog) return <div className="pt-32 text-center">Post not found.</div>

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] selection:bg-violet-200 dark:selection:bg-violet-900/50">
      
      {/* ─── HERO HEADER ──────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-violet-400/10 dark:bg-violet-900/20 rounded-full blur-3xl" />
          <div className="absolute top-[60%] -left-[10%] w-[40%] h-[60%] bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/blog" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors text-sm font-bold mb-8 group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Blog
            </Link>

            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                {blog.tags[0] || 'English'}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-8">
              {blog.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-neutral-400 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-sm font-black text-violet-600 dark:text-violet-400 border-2 border-white dark:border-neutral-800 shadow-sm">
                  {blog.author.name.charAt(0)}
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{blog.author.name}</span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-1.5">
                <CalendarBlank size={16} /> 
                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-1.5"><Clock size={16} /> 5 min read</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── COVER IMAGE ───────────────────────────────────────── */}
      <section className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 lg:-mt-12 mb-12 lg:mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-neutral-900 bg-slate-100 dark:bg-neutral-800 aspect-video lg:aspect-[21/9]"
        >
          <img src={blog.coverImage || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop'} alt={blog.title} className="w-full h-full object-cover" />
        </motion.div>
      </section>

      {/* ─── MAIN CONTENT ──────────────────────────────────────── */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12 relative">
          
          {/* Social Share Sidebar (Sticky) */}
          <div className="hidden lg:block w-16 flex-shrink-0">
            <div className="sticky top-32 flex flex-col gap-4">
              <span className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest rotate-180" style={{ writingMode: 'vertical-rl' }}>Share</span>
              <div className="w-px h-8 bg-slate-200 dark:bg-neutral-800 mx-auto" />
              <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-400 transition-colors">
                <TwitterLogo size={18} weight="fill" />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-600 transition-colors">
                <LinkedinLogo size={18} weight="fill" />
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-500 transition-colors">
                <FacebookLogo size={18} weight="fill" />
              </button>
              <div className="w-px h-8 bg-slate-200 dark:bg-neutral-800 mx-auto" />
              <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 flex items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-600 transition-colors">
                <BookmarkSimple size={18} weight="fill" />
              </button>
            </div>
          </div>

          {/* Article Body */}
          <article className="flex-1 min-w-0">
            <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed text-[1.1rem]">
              {blog.content}
            </div>

            {/* Tags & Mobile Share */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map(tag => (
                  <span key={tag} className="px-4 py-2 bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 text-sm font-bold rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer">
                    #{tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-3 lg:hidden">
                <span className="text-sm font-bold text-slate-500 mr-2">Share:</span>
                <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-slate-600 dark:text-neutral-400">
                  <TwitterLogo size={18} weight="fill" />
                </button>
                <button className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-900 flex items-center justify-center text-slate-600 dark:text-neutral-400">
                  <LinkedinLogo size={18} weight="fill" />
                </button>
                <button onClick={copyLink} className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 relative">
                  {copied ? <CheckCircle size={18} weight="fill" /> : <LinkIcon size={18} weight="bold" />}
                </button>
              </div>
            </div>

            {/* Author Box */}
            <div className="mt-12 bg-slate-50 dark:bg-neutral-900/50 rounded-3xl p-8 sm:p-10 border border-slate-100 dark:border-neutral-800">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="w-24 h-24 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl font-black text-violet-600 dark:text-violet-400 shadow-lg border-4 border-white dark:border-neutral-800">
                  {blog.author.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Written by {blog.author.name}</h3>
                  <p className="text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-wider mb-4">Content Author</p>
                  <p className="text-slate-500 dark:text-neutral-400 leading-relaxed mb-4">
                    Expert contributor at EnglishPro Academy. Passionate about helping students achieve their language goals through high-quality educational content.
                  </p>
                </div>
              </div>
            </div>

          </article>
        </div>
      </section>

      {/* ─── RELATED POSTS ──────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Read Next</h2>
              <Link to="/blog" className="hidden sm:flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:gap-3 transition-all">
                View all articles <ArrowRight size={16} weight="bold" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((post, idx) => (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group flex flex-col bg-white dark:bg-neutral-950 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
                >
                  <Link to={`/blog/slug/${post.slug}`} className="block h-48 overflow-hidden relative">
                    <img src={post.coverImage || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop'} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shadow-sm">
                        {post.tags[0] || 'English'}
                      </span>
                    </div>
                  </Link>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-neutral-500 mb-3">
                      <div className="flex items-center gap-1.5"><CalendarBlank size={14} /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB')}</div>
                      <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                      <div className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</div>
                    </div>
                    <Link to={`/blog/slug/${post.slug}`}>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
            
            <div className="mt-8 sm:hidden text-center">
              <Link to="/blog" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:gap-3 transition-all">
                View all articles <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}

