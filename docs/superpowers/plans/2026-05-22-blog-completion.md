# Blog Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the home page blog section to real API data, add a `readTime` field to blogs, and let admin control how many blogs appear on the home page.

**Architecture:** Add `readTime` to the blog Mongoose model and `homepage.blogCount` to site-settings. Update TypeScript types to match. Rewrite `Blog.tsx` (home section) to fetch real data in two API calls. Add `readTime` input to the AdminBlog form and a debounced home-count number input to the header. Replace the two hardcoded "5 min read" strings in `BlogPage.tsx` and `BlogPostPage.tsx`.

**Tech Stack:** Node.js + Express + Mongoose (server), React + TypeScript + react-hook-form + Tailwind (client), Vitest + React Testing Library (tests)

---

## File Map

| File | Action |
|------|--------|
| `server/src/models/blog.model.js` | Add `readTime` field |
| `server/src/models/site-settings.model.js` | Add `homepage.blogCount` field |
| `client/src/types/api.ts` | Add `readTime` to `Blog`; add `homepage` to `SiteSettings` |
| `client/src/components/Blog.tsx` | Full rewrite — fetch real data |
| `client/src/pages/admin/AdminBlog.tsx` | Add `readTime` field + home blog count control |
| `client/src/pages/BlogPage.tsx` | Replace 2× hardcoded "5 min read" |
| `client/src/pages/BlogPostPage.tsx` | Replace 1× hardcoded "5 min read" |

---

### Task 1: Add `readTime` to blog model

**Files:**
- Modify: `server/src/models/blog.model.js`

- [ ] **Step 1: Add the field**

In `blog.model.js`, after the `isDeleted` field (line 25), insert:

```js
readTime: { type: String, default: '5 min read', trim: true },
```

Full updated schema block:

```js
const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: [true, 'Blog content is required'] },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    coverImage: { type: String, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    readTime: { type: String, default: '5 min read', trim: true },
  },
  { timestamps: true, versionKey: false }
)
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/blog.model.js
git commit -m "feat: add readTime field to blog model"
```

---

### Task 2: Add `homepage.blogCount` to site-settings model

**Files:**
- Modify: `server/src/models/site-settings.model.js`

- [ ] **Step 1: Add the homepage section**

After the `blockedCountries` field (line 33), before the closing `}` of the schema options, insert:

```js
homepage: {
  blogCount: { type: Number, default: 3, min: 1, max: 12 },
},
```

Full updated schema body (only the new section shown in context):

```js
    paymentsSetup: { type: mongoose.Schema.Types.Mixed, default: null },
    blockedCountries: { type: [String], default: ['IN'] },
    homepage: {
      blogCount: { type: Number, default: 3, min: 1, max: 12 },
    },
```

- [ ] **Step 2: Commit**

```bash
git add server/src/models/site-settings.model.js
git commit -m "feat: add homepage.blogCount to site-settings model"
```

---

### Task 3: Update TypeScript types

**Files:**
- Modify: `client/src/types/api.ts`

- [ ] **Step 1: Add `readTime` to Blog interface**

Find the `Blog` interface (line 307). Add `readTime` after `publishedAt`:

```ts
export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: { _id: string; name: string; profileImage?: string; bio?: string };
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  readTime?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Add `readTime` to `CreateBlogDto`**

Find the `CreateBlogDto` interface (line 322). Add `readTime`:

```ts
export interface CreateBlogDto {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  slug?: string;
  readTime?: string;
}
```

- [ ] **Step 3: Add `homepage` to `SiteSettings` interface**

Find the `SiteSettings` interface (line 468). Add `homepage`:

```ts
export interface SiteSettings {
  _id: string;
  site: { name?: string; tagline?: string; logoText?: string; footerCopyright?: string };
  contact: { phone?: string; email?: string; whatsapp?: string; address?: string; workingHours?: string };
  social: { facebook?: string; instagram?: string; twitter?: string; linkedin?: string; youtube?: string };
  seo: { metaTitle?: string; metaDescription?: string; keywords?: string };
  homepage?: {
    blogCount?: number;
  };
  logoUrl?: string;
  bannerUrl?: string;
  paymentsSetup?: Record<string, unknown>;
  blockedCountries?: string[];
  updatedAt: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/types/api.ts
git commit -m "feat: add readTime to Blog type and homepage to SiteSettings type"
```

---

### Task 4: Rewrite `Blog.tsx` — API-driven home section

**Files:**
- Modify: `client/src/components/Blog.tsx`

- [ ] **Step 1: Replace the entire file**

The current file has a hardcoded `POSTS` array. Replace it completely with:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Blog.tsx
git commit -m "feat: wire Blog home section to real API data"
```

---

### Task 5: Add `readTime` field and home blog count control to `AdminBlog.tsx`

**Files:**
- Modify: `client/src/pages/admin/AdminBlog.tsx`

There are four targeted edits to this file:

**Edit A — imports**: add `siteSettingsService` import and a `useRef` + `useCallback` import for debouncing.

**Edit B — state + debounced logic**: add `homeBlogCount` state and a debounced PATCH side-effect.

**Edit C — header**: add the home blog count `<input type="number">` control next to "New Article".

**Edit D — form**: add `readTime` field; update `openEdit` and `EMPTY_BLOG` to include `readTime`; update preview to use it.

- [ ] **Step 1: Add imports**

Replace the import section at the top of `AdminBlog.tsx`:

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, PencilSimple, Trash, X, Check, Eye, MagnifyingGlass,
  Clock, Tag, Globe, FileText, CalendarBlank, ArrowLeft,
  TwitterLogo, LinkedinLogo, FacebookLogo, BookmarkSimple
} from '@phosphor-icons/react'
import { blogService } from '../../services/blog.service'
import { siteSettingsService } from '../../services/site-settings.service'
import type { Blog, CreateBlogDto } from '../../types/api'
import { extractApiError } from '../../utils/apiError'
```

- [ ] **Step 2: Update `EMPTY_BLOG` constant**

Replace the `EMPTY_BLOG` constant:

```tsx
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
```

- [ ] **Step 3: Add home blog count state and debounced save**

After the existing state declarations (after `const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')`), add:

```tsx
  const [homeBlogCount, setHomeBlogCount] = useState(3)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
```

After the `useForm` call, add the effects to load and save `homeBlogCount`:

```tsx
  useEffect(() => {
    siteSettingsService.get()
      .then(s => setHomeBlogCount(s.homepage?.blogCount ?? 3))
      .catch(() => {})
  }, [])

  const saveHomeBlogCount = useCallback((value: number) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(async () => {
      try {
        await siteSettingsService.update({ homepage: { blogCount: value } })
      } catch {
        toast.error('Failed to save home blog count')
      }
    }, 500)
  }, [])
```

- [ ] **Step 4: Update `openEdit` to include `readTime`**

Replace the `openEdit` function:

```tsx
  const openEdit = (blog: Blog) => {
    reset({
      title: blog.title,
      content: blog.content,
      excerpt: blog.excerpt || '',
      coverImage: blog.coverImage || '',
      status: blog.status,
      slug: blog.slug,
      readTime: blog.readTime || '5 min read',
      tagsInput: blog.tags.join(', ')
    })
    setEditingId(blog._id)
    setModalType('edit')
    setActiveTab('edit')
  }
```

- [ ] **Step 5: Update `onSave` to include `readTime`**

Replace the `onSave` handler's `blogData` construction:

```tsx
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
```

_(No change needed here — `...data` already spreads `readTime`. Just verify it's not filtered out.)_

- [ ] **Step 6: Add home count control to header**

Replace the header `<div>` block (starting at `{/* Header */}`) with:

```tsx
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
                const val = Math.min(12, Math.max(1, Number(e.target.value)))
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
```

- [ ] **Step 7: Add `readTime` form field**

In the editor column, find the grid that contains "Cover Image URL" and "Tags (separated by comma)" fields:

```tsx
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Cover Image URL">
                          <input {...register('coverImage')} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium outline-none focus:border-violet-500 transition-all" />
                        </Field>
                        <Field label="Tags (separated by comma)">
                          <input {...register('tagsInput')} placeholder="Grammar, Tips, IELTS" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/50 text-sm font-medium outline-none focus:border-violet-500 transition-all" />
                        </Field>
                      </div>
```

Replace with a three-field grid (Cover Image, Tags, Read Time):

```tsx
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
```

- [ ] **Step 8: Update `useForm` defaultValues to include `readTime`**

Replace the `useForm` call:

```tsx
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateBlogDto & { tagsInput: string }>({
    defaultValues: { ...EMPTY_BLOG, tagsInput: '' }
  })
```

_(No change needed — `EMPTY_BLOG` already includes `readTime: '5 min read'` after Step 2.)_

- [ ] **Step 9: Update live preview to use `watchedReadTime`**

After the existing `watch` calls, add:

```tsx
  const watchedReadTime = watch('readTime')
```

Then in the preview column, find:

```tsx
                          <div className="flex items-center gap-1"><Clock size={14} /> 5 min read</div>
```

Replace with:

```tsx
                          <div className="flex items-center gap-1"><Clock size={14} /> {watchedReadTime || '5 min read'}</div>
```

- [ ] **Step 10: Commit**

```bash
git add client/src/pages/admin/AdminBlog.tsx
git commit -m "feat: add readTime field and home blog count control to AdminBlog"
```

---

### Task 6: Replace hardcoded "5 min read" in `BlogPage.tsx`

**Files:**
- Modify: `client/src/pages/BlogPage.tsx`

There is one occurrence of `5 min read` in this file — in the main posts grid (line 262).

- [ ] **Step 1: Fix main grid (line 262)**

Find:

```tsx
                      <div className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</div>
```

Replace with:

```tsx
                      <div className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime ?? '5 min read'}</div>
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/BlogPage.tsx
git commit -m "feat: use blog.readTime in BlogPage instead of hardcoded value"
```

---

### Task 7: Replace hardcoded "5 min read" in `BlogPostPage.tsx`

**Files:**
- Modify: `client/src/pages/BlogPostPage.tsx`

There are two occurrences in this file — one in the hero metadata (line 102) and one in the related posts grid (line 228).

- [ ] **Step 1: Fix hero metadata (line 102)**

Find:

```tsx
              <div className="flex items-center gap-1.5"><Clock size={16} /> 5 min read</div>
```

Replace with:

```tsx
              <div className="flex items-center gap-1.5"><Clock size={16} /> {blog.readTime ?? '5 min read'}</div>
```

- [ ] **Step 2: Fix related posts grid (line 228)**

Find (inside the related posts `{related.map(...)}` block):

```tsx
                      <div className="flex items-center gap-1.5"><Clock size={14} /> 5 min read</div>
```

Replace with:

```tsx
                      <div className="flex items-center gap-1.5"><Clock size={14} /> {post.readTime ?? '5 min read'}</div>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/BlogPostPage.tsx
git commit -m "feat: use blog.readTime in BlogPostPage instead of hardcoded value"
```

---

### Task 8: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
# In the project root (two terminals):
cd server && npm run dev
cd client && npm run dev
```

- [ ] **Step 2: Verify home page shows real blogs**

Open `http://localhost:5173`. Scroll to the Blog section. Confirm it shows real published blog posts fetched from the API (not the old hardcoded static cards). If no blogs are published yet, create one in admin first.

- [ ] **Step 3: Verify home blog count control**

In admin dashboard → Blog Manager, change the "Show X blogs on home page" number to 2. Reload the home page and confirm only 2 posts appear.

- [ ] **Step 4: Verify readTime field in admin form**

In admin → Blog Manager → New Article, confirm the "Read Time" field appears below Tags. Set it to "3 min read" and publish the blog. Open the post on `/blog/slug/<slug>` and confirm the hero shows "3 min read". Open `/blog` and confirm the same.

- [ ] **Step 5: Verify fallback on API failure**

Temporarily stop the server. Reload the home page. Confirm the 3 fallback static cards appear (no broken layout, no blank section).

- [ ] **Step 6: Verify existing blogs default readTime**

Open a blog that existed before this change. Confirm it shows "5 min read" (the model default).
