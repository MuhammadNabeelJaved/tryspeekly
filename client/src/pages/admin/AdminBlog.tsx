import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, PencilSimple, Trash, X, Check, Eye, MagnifyingGlass,
  Clock, Tag, Globe, FileText, CalendarBlank, ArrowLeft,
  TwitterLogo, LinkedinLogo, FacebookLogo, BookmarkSimple, Star
} from '@phosphor-icons/react'
import { blogService } from '../../services/blog.service'
import { siteSettingsService } from '../../services/site-settings.service'
import type { Blog, CreateBlogDto } from '../../types/api'
import { extractApiError } from '../../utils/apiError'
import NewsletterEditor from '../../components/NewsletterEditor'

const EMPTY_BLOG: CreateBlogDto = {
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  tags: [],
  status: 'draft',
  slug: '',
  readTime: '5 min read',
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  draft: 'bg-slate-200 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300',
  archived: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-wider block">{label}</label>
      {children}
    </div>
  )
}

export default function AdminBlog() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [modalType, setModalType] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')
  const [homeBlogCount, setHomeBlogCount] = useState(3)
  const [featuredBlogIds, setFeaturedBlogIds] = useState<string[]>([])
  const [editorInitialContent, setEditorInitialContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const featuredDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateBlogDto & { tagsInput: string }>({
    defaultValues: { ...EMPTY_BLOG, tagsInput: '' }
  })

  useEffect(() => {
    siteSettingsService.get()
      .then(s => {
        setHomeBlogCount(s.homepage?.blogCount ?? 3)
        setFeaturedBlogIds((s.homepage?.featuredBlogIds ?? []) as string[])
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  const saveHomeBlogCount = useCallback((value: number) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      try {
        await siteSettingsService.update({ homepage: { blogCount: value } } as any)
      } catch {
        toast.error('Failed to save home blog count')
      }
    }, 500)
  }, [])

  const saveFeaturedBlogs = useCallback((ids: string[]) => {
    if (featuredDebounce.current) clearTimeout(featuredDebounce.current)
    featuredDebounce.current = setTimeout(async () => {
      try {
        await siteSettingsService.update({ homepage: { featuredBlogIds: ids } } as any)
      } catch {
        toast.error('Failed to save featured blogs')
      }
    }, 500)
  }, [])

  function toggleFeaturedBlog(id: string) {
    setFeaturedBlogIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      saveFeaturedBlogs(next)
      return next
    })
  }

  // Watch fields for live preview
  const watchedTitle = watch('title')
  const watchedContent = watch('content')
  const watchedCoverImage = watch('coverImage')
  const watchedTagsInput = watch('tagsInput')
  const watchedExcerpt = watch('excerpt')
  const watchedStatus = watch('status')
  const watchedSlug = watch('slug')
  const watchedReadTime = watch('readTime')

  const fetchBlogs = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter !== 'All') params.status = statusFilter.toLowerCase()
      if (search) params.search = search
      
      const response = await blogService.getAdminBlogs(params)
      setBlogs(response.data)
    } catch (error: unknown) {
      toast.error(extractApiError(error, 'Failed to load blog posts.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchBlogs, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const openAdd = () => {
    reset({ ...EMPTY_BLOG, tagsInput: '' })
    setEditorInitialContent('')
    setEditorKey(k => k + 1)
    setModalType('add')
    setEditingId(null)
    setActiveTab('edit')
  }

  const openEdit = async (blog: Blog) => {
    setEditingId(blog._id)
    setModalType('edit')
    setActiveTab('edit')
    reset({
      title: blog.title,
      content: '',
      excerpt: blog.excerpt || '',
      coverImage: blog.coverImage || '',
      status: blog.status,
      slug: blog.slug,
      readTime: blog.readTime || '5 min read',
      tagsInput: blog.tags.join(', ')
    })
    setEditorInitialContent('')
    setEditorKey(k => k + 1)
    try {
      const res = await blogService.getAdminBlogById(blog._id)
      const fullContent = res.data.content || ''
      setValue('content', fullContent)
      setEditorInitialContent(fullContent)
      setEditorKey(k => k + 1)
    } catch {
      // silently ignore — editor stays empty
    }
  }

  const onSave = async (data: CreateBlogDto & { tagsInput: string }) => {
    setIsSubmitting(true)
    try {
      const blogData: CreateBlogDto = {
        ...data,
        tags: data.tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      }

      if (modalType === 'add') {
        await blogService.createBlog(blogData)
      } else if (editingId) {
        await blogService.updateBlog(editingId, blogData)
      }
      
      setModalType(null)
      fetchBlogs()
      toast.success(modalType === 'add' ? 'Blog post created.' : 'Blog post updated.')
    } catch (error: unknown) {
      toast.error(extractApiError(error, 'Failed to save blog post.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await blogService.deleteBlog(id)
      setDeleteId(null)
      fetchBlogs()
      toast.success('Blog post deleted.')
    } catch (error: unknown) {
      toast.error(extractApiError(error, 'Failed to delete blog post.'))
    }
  }

  // Preview data processing
  const previewTags = watchedTagsInput.split(',').map(t => t.trim()).filter(Boolean)

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full bg-slate-50 dark:bg-neutral-950">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            Blog Manager
            <span className="text-sm font-medium text-slate-400 dark:text-neutral-500 bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded-lg">
              {blogs.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">Manage articles according to platform design</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-neutral-400 whitespace-nowrap">
            Show
            <input
              type="number"
              min={1}
              max={12}
              value={homeBlogCount}
              onChange={e => {
                const raw = e.target.value
                if (raw === '') return
                const val = Math.min(12, Math.max(1, Number(raw)))
                if (isNaN(val)) return
                setHomeBlogCount(val)
                saveHomeBlogCount(val)
              }}
              className="w-14 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-slate-900 dark:text-white text-center text-sm font-bold outline-none focus:border-violet-500 transition-all"
            />
            blogs on home page
          </label>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-sm font-bold shadow-[0_8px_20px_rgba(124,58,237,0.25)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus size={16} weight="bold" /> New Article
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-neutral-600" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by title or content…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 dark:focus:border-violet-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Published', 'Draft', 'Archived'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === status 
                  ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20' 
                  : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400 hover:border-violet-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Blog List */}
      <div className="flex-1 min-h-0">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white dark:bg-neutral-900 animate-pulse border border-slate-100 dark:border-neutral-800" />
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-[32px] border-2 border-dashed border-slate-100 dark:border-neutral-800">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-300 dark:text-neutral-700 mb-4">
              <FileText size={32} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">No articles found</p>
            <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1">Try adjusting your search or create a new post</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
            {blogs.map((blog, idx) => (
              <motion.div 
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white dark:bg-neutral-900 rounded-[32px] border border-slate-100 dark:border-neutral-800 overflow-hidden hover:border-violet-200 dark:hover:border-violet-800 hover:shadow-2xl hover:shadow-violet-200/20 dark:hover:shadow-black/20 transition-all duration-300 flex flex-col"
              >
                <div className="h-44 bg-slate-100 dark:bg-neutral-800 relative overflow-hidden">
                  {blog.coverImage ? (
                    <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-neutral-700">
                      <Globe size={48} weight="thin" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm ${STATUS_COLORS[blog.status]}`}>
                      {blog.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">
                      {new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {blog.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
                    {blog.excerpt || 'No description provided for this article.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {blog.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-neutral-800 text-[10px] font-bold text-slate-400 dark:text-neutral-500">
                        <Tag size={10} /> {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-50 dark:border-neutral-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-black text-violet-600 dark:text-violet-400 overflow-hidden flex-shrink-0">
                        {blog.author.profileImage
                          ? <img src={blog.author.profileImage} alt="" className="w-full h-full object-cover" />
                          : (blog.author.role === 'admin' ? 'A' : blog.author.name.charAt(0))}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-neutral-400 block">
                          {blog.author.role === 'admin' ? 'Admin' : blog.author.name}
                        </span>
                        {blog.author.role === 'team_member' && blog.author.jobTitle && (
                          <span className="text-[9px] font-semibold text-violet-500 dark:text-violet-400">
                            {blog.author.jobTitle}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      {blog.status === 'published' && (
                        <button
                          onClick={() => toggleFeaturedBlog(blog._id)}
                          title={featuredBlogIds.includes(blog._id) ? 'Remove from homepage' : 'Feature on homepage'}
                          className={`p-2 rounded-xl transition-all ${
                            featuredBlogIds.includes(blog._id)
                              ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20'
                              : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          }`}
                        >
                          <Star size={16} weight={featuredBlogIds.includes(blog._id) ? 'fill' : 'regular'} />
                        </button>
                      )}
                      <button onClick={() => openEdit(blog)} className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all">
                        <PencilSimple size={16} />
                      </button>
                      <button onClick={() => setDeleteId(blog._id)} className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL WITH LIVE PREVIEW */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalType(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.form 
              onSubmit={handleSubmit(onSave)}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-neutral-900 rounded-none sm:rounded-[40px] w-full max-w-7xl h-full sm:max-h-[92vh] overflow-hidden border border-slate-100 dark:border-neutral-800 shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 z-10 flex-shrink-0">
                <div className="flex items-center gap-6">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{modalType === 'add' ? 'Create New Article' : 'Edit Article'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${watchedStatus === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{watchedStatus || 'draft'}</p>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="hidden md:flex bg-slate-50 dark:bg-neutral-800 p-1 rounded-2xl gap-1">
                    <button type="button" onClick={() => setActiveTab('edit')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-neutral-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Write</button>
                    <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-neutral-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Live Preview</button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setModalType(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                    <X size={20} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Editor Column */}
                <div className={`flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar ${activeTab === 'preview' ? 'hidden md:block border-r border-slate-100 dark:border-neutral-800' : 'block'}`}>
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                      <Field label="Title">
                        <input {...register('title', { required: true })} placeholder="Main Headline" className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-base font-bold text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-all" />
                      </Field>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="URL Slug (Optional)">
                          <input {...register('slug')} placeholder="e.g. master-english-fast" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium text-slate-600 dark:text-neutral-400 outline-none focus:border-violet-500 transition-all" />
                        </Field>
                        <Field label="Status">
                          <select {...register('status')} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-bold text-slate-700 dark:text-neutral-200 outline-none focus:border-violet-500 transition-all">
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                        </Field>
                      </div>

                      <Field label="Excerpt / Summary">
                        <textarea {...register('excerpt')} rows={2} placeholder="A catchy summary for the blog card..." className="w-full px-5 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm text-slate-600 dark:text-neutral-300 outline-none focus:border-violet-500 transition-all resize-none leading-relaxed" />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Cover Image URL">
                          <input {...register('coverImage')} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium outline-none focus:border-violet-500 transition-all" />
                        </Field>
                        <Field label="Tags (separated by comma)">
                          <input {...register('tagsInput')} placeholder="Grammar, Tips, IELTS" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium outline-none focus:border-violet-500 transition-all" />
                        </Field>
                      </div>

                      <Field label="Read Time">
                        <input {...register('readTime')} placeholder="5 min read" className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium outline-none focus:border-violet-500 transition-all" />
                      </Field>

                      <Field label="Article Body Content">
                        <div className="rounded-[20px] overflow-hidden border border-slate-200 dark:border-neutral-800">
                          <NewsletterEditor
                            key={editorKey}
                            value={editorInitialContent}
                            onChange={html => setValue('content', html, { shouldValidate: true })}
                            height={600}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Preview Column (BlogPostPage Lookalike) */}
                <div className={`flex-1 overflow-y-auto bg-white dark:bg-neutral-950 ${activeTab === 'edit' ? 'hidden md:block' : 'block'}`}>
                  <div className="min-h-full">
                    {/* Header Mockup */}
                    <div className="bg-slate-50 dark:bg-neutral-900 py-12 px-6 border-b border-slate-100 dark:border-neutral-800 text-center">
                      <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-xs uppercase tracking-widest mb-4">
                          <Globe size={14} /> {previewTags[0] || 'Uncategorized'}
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-6">{watchedTitle || 'Your Article Title'}</h1>
                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center font-black text-[10px] text-violet-600">A</div>
                            <span className="text-slate-900 dark:text-slate-200 font-bold">Admin</span>
                          </div>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <div className="flex items-center gap-1"><CalendarBlank size={14} /> Today</div>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <div className="flex items-center gap-1"><Clock size={14} /> {watchedReadTime || '5 min read'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Image Mockup */}
                    <div className="max-w-3xl mx-auto px-6 -mt-6">
                      <div className="aspect-video rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-neutral-900 bg-slate-100 dark:bg-neutral-800">
                        {watchedCoverImage ? (
                          <img src={watchedCoverImage} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300"><Globe size={64} weight="thin" /></div>
                        )}
                      </div>
                    </div>

                    {/* Content Mockup */}
                    <div className="max-w-3xl mx-auto px-6 py-12 flex gap-10">
                      {/* Social bar mock */}
                      <div className="hidden lg:flex flex-col gap-4 pt-4">
                         <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 flex items-center justify-center text-slate-300"><TwitterLogo /></div>
                         <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-neutral-800 flex items-center justify-center text-slate-300"><LinkedinLogo /></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-600 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed font-serif italic text-lg opacity-60 mb-8">
                          {watchedExcerpt}
                        </div>
                        {watchedContent ? (
                          <div
                            className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-neutral-200 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: watchedContent }}
                          />
                        ) : (
                          <p className="text-slate-400 dark:text-neutral-600 italic">Article content will appear here...</p>
                        )}
                        
                        <div className="mt-12 pt-8 border-t border-slate-50 dark:border-neutral-800 flex flex-wrap gap-2">
                           {previewTags.map(tag => (
                             <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-neutral-900 text-slate-500 text-xs font-bold rounded-lg">#{tag}</span>
                           ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 sm:px-8 py-4 sm:py-6 border-t border-slate-50 dark:border-neutral-800/50 flex flex-col sm:flex-row gap-3 bg-white dark:bg-neutral-900 flex-shrink-0">
                <button type="button" onClick={() => setModalType(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 text-sm font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black flex items-center justify-center gap-2 shadow-[0_12px_24px_rgba(124,58,237,0.3)] transition-all disabled:opacity-50">
                  {isSubmitting ? <span className="animate-pulse">Saving...</span> : <><Check size={18} weight="bold" /> {modalType === 'add' ? 'Create Article' : 'Save Changes'}</>}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRM */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-neutral-900 rounded-[32px] p-8 w-full max-w-sm border border-slate-100 dark:border-neutral-800 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-6"><Trash size={28} className="text-red-500" /></div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Delete Article?</h3>
              <p className="text-sm text-slate-500 dark:text-neutral-500 mb-8 leading-relaxed">This action is permanent and will remove the post from the platform.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-neutral-800 text-sm font-bold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">Keep Post</button>
                <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all shadow-lg shadow-red-500/20">Delete Now</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
