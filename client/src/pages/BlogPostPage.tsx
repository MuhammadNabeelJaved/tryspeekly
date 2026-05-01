import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, CalendarBlank, Clock, 
  TwitterLogo, LinkedinLogo, FacebookLogo, Link as LinkIcon,
  BookmarkSimple, CheckCircle, ArrowRight
} from '@phosphor-icons/react'

// Dummy Data for a Single Blog Post
const POST = {
  id: 1,
  title: '10 Proven Strategies to Achieve a Band 8 in IELTS Speaking',
  category: 'IELTS Prep',
  readTime: '8 min read',
  date: 'May 12, 2026',
  image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop',
  author: {
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    role: 'Former IELTS Examiner & Senior Tutor',
    bio: 'Sarah has over 12 years of experience as an IELTS examiner and has helped thousands of students achieve their target band scores. She specializes in advanced speaking techniques and pronunciation.'
  },
  tags: ['IELTS', 'Speaking', 'Exam Tips', 'Band 8', 'Fluency'],
  content: [
    { type: 'paragraph', text: 'Scoring a Band 8 in the IELTS Speaking test is a goal for many, but achieving it requires more than just good English. It demands a deep understanding of the test criteria, the ability to use complex language naturally, and the confidence to express your ideas fluently.' },
    { type: 'paragraph', text: 'In this comprehensive guide, we will explore 10 proven strategies that can elevate your speaking performance from a Band 6 or 7 to an impressive Band 8. These are the exact techniques I\'ve used to train my top-performing students.' },
    { type: 'heading', text: '1. Master the Art of Paraphrasing' },
    { type: 'paragraph', text: 'Examiners are listening for your ability to use a wide range of vocabulary. When the examiner asks you a question, never repeat their exact words. Instead, paraphrase the question using synonyms and different grammatical structures.' },
    { type: 'quote', text: 'Paraphrasing shows the examiner that you have a flexible and extensive vocabulary, which is a key requirement for a Band 8.' },
    { type: 'paragraph', text: 'For example, if the examiner asks, "Do you like reading books?", instead of saying, "Yes, I like reading books," you could say, "Absolutely, I\'ve always been an avid reader," or "I\'m quite passionate about literature."' },
    { type: 'heading', text: '2. Use Idiomatic Language Naturally' },
    { type: 'paragraph', text: 'To achieve a Band 8 in the Lexical Resource criterion, you must use uncommon vocabulary and idiomatic expressions. However, the key word here is naturally. Don\'t force idioms into your answers if they don\'t fit the context perfectly.' },
    { type: 'list', items: [
      'Once in a blue moon (very rarely)',
      'A piece of cake (very easy)',
      'Over the moon (extremely happy)',
      'To hit the nail on the head (to be exactly right)'
    ]},
    { type: 'heading', text: '3. Develop Your Answers Fully' },
    { type: 'paragraph', text: 'A common mistake is giving short, one-sentence answers, especially in Part 1. For a Band 8, you need to show that you can speak at length without hesitation. Use the "Answer + Reason + Example" formula to expand your responses.' },
    { type: 'heading', text: '4. Focus on Pronunciation Features' },
    { type: 'paragraph', text: 'Pronunciation isn\'t just about having a "native-like" accent. It\'s about being easily understood and using pronunciation features effectively. This includes word stress, sentence stress, intonation (how your voice rises and falls), and linking words together smoothly.' }
  ],
  relatedPosts: [
    {
      id: 2,
      title: 'Mastering the Perfect Tenses: A Complete Guide',
      category: 'Grammar',
      readTime: '6 min read',
      date: 'May 08, 2026',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
    },
    {
      id: 7,
      title: 'IELTS Writing Task 2: Structuring Your Essay',
      category: 'IELTS Prep',
      readTime: '9 min read',
      date: 'April 10, 2026',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop', // Same image for dummy purpose
    }
  ]
}

export default function BlogPostPage() {
  const { id } = useParams()
  const [copied, setCopied] = useState(false)

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white dark:bg-neutral-950 min-h-screen pt-[72px] lg:pt-[80px] selection:bg-violet-200 dark:selection:bg-violet-900/50">
      
      {/* ─── READING PROGRESS BAR ──────────────────────────────── */}
      <motion.div 
        className="fixed top-[72px] lg:top-[80px] left-0 right-0 h-1 bg-violet-600 origin-left z-40"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
        viewport={{ margin: "0px 0px -100% 0px" }}
        style={{ scaleX: 0 }} // In a real app, use Framer Motion's useScroll hook for a real progress bar
      />

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
                {POST.category}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-8">
              {POST.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-neutral-400 font-medium">
              <div className="flex items-center gap-3">
                <img src={POST.author.avatar} alt={POST.author.name} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-neutral-800 shadow-sm" />
                <span className="text-slate-900 dark:text-white font-bold">{POST.author.name}</span>
              </div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-1.5"><CalendarBlank size={16} /> {POST.date}</div>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
              <div className="flex items-center gap-1.5"><Clock size={16} /> {POST.readTime}</div>
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
          <img src={POST.image} alt={POST.title} className="w-full h-full object-cover" />
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
            <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-neutral-300">
              {POST.content.map((block, idx) => {
                if (block.type === 'paragraph') {
                  return (
                    <p key={idx} className="mb-6 leading-relaxed text-[1.1rem]">
                      {block.text}
                    </p>
                  )
                }
                if (block.type === 'heading') {
                  return (
                    <h2 key={idx} className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-12 mb-6 tracking-tight">
                      {block.text}
                    </h2>
                  )
                }
                if (block.type === 'quote') {
                  return (
                    <blockquote key={idx} className="border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-900/10 p-6 my-8 rounded-r-2xl italic text-slate-700 dark:text-neutral-200 font-medium text-lg">
                      "{block.text}"
                    </blockquote>
                  )
                }
                if (block.type === 'list') {
                  return (
                    <ul key={idx} className="space-y-3 mb-8">
                      {block.items?.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle size={24} weight="fill" className="text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-[1.1rem]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )
                }
                return null
              })}
            </div>

            {/* Tags & Mobile Share */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {POST.tags.map(tag => (
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
                <img src={POST.author.avatar} alt={POST.author.name} className="w-24 h-24 rounded-full object-cover shadow-lg" />
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Written by {POST.author.name}</h3>
                  <p className="text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-wider mb-4">{POST.author.role}</p>
                  <p className="text-slate-500 dark:text-neutral-400 leading-relaxed mb-4">
                    {POST.author.bio}
                  </p>
                  <button className="text-sm font-bold text-slate-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors underline decoration-2 underline-offset-4 decoration-violet-500/30">
                    View all posts by Sarah
                  </button>
                </div>
              </div>
            </div>

          </article>
        </div>
      </section>

      {/* ─── RELATED POSTS ──────────────────────────────────────── */}
      <section className="py-16 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Read Next</h2>
            <Link to="/blog" className="hidden sm:flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold hover:gap-3 transition-all">
              View all articles <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {POST.relatedPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group flex flex-col bg-white dark:bg-neutral-950 rounded-3xl overflow-hidden border border-slate-100 dark:border-neutral-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-400"
              >
                <Link to={`/blog/${post.id}`} className="block h-48 overflow-hidden relative">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-violet-600 dark:text-violet-400 text-xs font-bold rounded-lg shadow-sm">
                      {post.category}
                    </span>
                  </div>
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-400 dark:text-neutral-500 mb-3">
                    <div className="flex items-center gap-1.5"><CalendarBlank size={14} /> {post.date}</div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-neutral-700" />
                    <div className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime}</div>
                  </div>
                  <Link to={`/blog/${post.id}`}>
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

    </div>
  )
}