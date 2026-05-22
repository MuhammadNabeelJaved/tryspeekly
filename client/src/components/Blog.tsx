import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Calendar, Clock } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { blogService } from '../services/blog.service'
import { siteSettingsService } from '../services/site-settings.service'
import type { Blog } from '../types/api'

const FALLBACK_POSTS = [
  {
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&q=80',
    tags: ['Learning Tips'],
    title: '10 Proven Techniques to Improve Your English Speaking Confidence',
    publishedAt: undefined,
    createdAt: '2026-04-15T00:00:00.000Z',
    readTime: '5 min read',
    excerpt: 'Discover practical strategies used by successful English learners to overcome fear and speak fluently.',
    slug: '',
    _id: 'fallback-1',
  },
  {
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&q=80',
    tags: ['Vocabulary'],
    title: 'Master Business English: Essential Vocabulary for Professional Success',
    publishedAt: undefined,
    createdAt: '2026-04-10T00:00:00.000Z',
    readTime: '8 min read',
    excerpt: 'Build your professional vocabulary with these must-know terms for meetings and presentations.',
    slug: '',
    _id: 'fallback-2',
  },
  {
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&q=80',
    tags: ['Grammar'],
    title: 'Common English Grammar Mistakes and How to Avoid Them',
    publishedAt: undefined,
    createdAt: '2026-04-05T00:00:00.000Z',
    readTime: '6 min read',
    excerpt: 'Learn about the most frequent grammar errors made by English learners.',
    slug: '',
    _id: 'fallback-3',
  },
] as Blog[]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
}

export default function Blog() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [posts, setPosts] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        let count = 3
        try {
          const settings = await siteSettingsService.get()
          count = settings.homepage?.blogCount ?? 3
        } catch {
          // settings fetch failed — use default 3
        }

        const response = await blogService.getAllBlogs({ status: 'published', limit: count })
        setPosts(response.data.length > 0 ? response.data : FALLBACK_POSTS)
      } catch {
        setPosts(FALLBACK_POSTS)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section id="blog" className="bg-gray-50 dark:bg-neutral-950 py-16 lg:py-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 md:gap-6 mb-12 md:mb-14">
          <div>
            <span className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-200 text-sm font-semibold mb-4">
              <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              News &amp; Blog
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold text-gray-900 dark:text-white leading-tight tracking-tight max-w-lg">
              Explore Our Latest News &amp; Blog
            </h2>
          </div>
          <Link
            to="/blog"
            className="hidden lg:inline-flex items-center gap-2 text-violet-600 dark:text-violet-200 hover:text-violet-700 dark:hover:text-violet-100 font-semibold text-sm transition-colors"
          >
            View All Posts
            <ArrowRight size={15} weight="bold" />
          </Link>
        </div>

        {/* Blog cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-2xl bg-white dark:bg-neutral-900 animate-pulse border border-gray-100 dark:border-neutral-800" />
            ))}
          </div>
        ) : (
          <motion.div
            ref={ref}
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-3 gap-7"
          >
            {posts.map((post) => (
              <motion.article
                key={post._id}
                variants={cardVariants}
                whileHover={{ scale: 1.04 }}
                className="group bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-300 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={post.coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=700&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <motion.div
                    className="absolute top-4 left-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-800/40 text-violet-600 dark:text-violet-200 transition-all duration-300 group-hover:scale-105">
                      {post.tags[0] || 'English'}
                    </span>
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-4 text-gray-400 dark:text-gray-500 text-[11px] font-medium mb-3">
                    <motion.span
                      className="flex items-center gap-1"
                      whileHover={{ color: '#7c3aed' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Calendar size={11} weight="fill" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </motion.span>
                    <motion.span
                      className="flex items-center gap-1"
                      whileHover={{ color: '#7c3aed' }}
                      transition={{ duration: 0.2 }}
                    >
                      <Clock size={11} weight="fill" />
                      {post.readTime ?? '5 min read'}
                    </motion.span>
                  </div>

                  <motion.h3
                    className="text-[16px] font-bold text-gray-900 dark:text-white leading-snug mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-200 transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    {post.title}
                  </motion.h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-5 line-clamp-2 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                    {post.excerpt}
                  </p>

                  {post.slug ? (
                    <Link to={`/blog/slug/${post.slug}`}>
                      <motion.span
                        className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-200 hover:text-violet-700 dark:hover:text-violet-100 font-semibold text-sm transition-all duration-300"
                        whileHover={{ x: 4 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <span>Read More</span>
                        <ArrowRight size={14} weight="bold" />
                      </motion.span>
                    </Link>
                  ) : (
                    <motion.span
                      className="inline-flex items-center gap-1.5 text-violet-600 dark:text-violet-200 font-semibold text-sm"
                      whileHover={{ x: 4 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <span>Read More</span>
                      <ArrowRight size={14} weight="bold" />
                    </motion.span>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        {/* Mobile view all */}
        <div className="flex justify-center mt-10 lg:hidden">
          <Link to="/blog" className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-200 font-semibold text-sm">
            View All Posts
            <ArrowRight size={15} weight="bold" />
          </Link>
        </div>
      </div>
    </section>
  )
}
