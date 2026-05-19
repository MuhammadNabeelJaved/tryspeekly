import asyncHandler from '../utils/asyncHandler.js'
import Seo from '../models/seo.model.js'
import { NotFoundError, BadRequestError } from '../utils/apiErrors.js'

// Default pages seeded on first request
const DEFAULT_PAGES = [
  { pageSlug: '__global__', pageName: 'Global Settings', pageUrl: '/', isPublic: false },
  { pageSlug: 'home',          pageName: 'Home',           pageUrl: '/',               isPublic: true  },
  { pageSlug: 'courses',       pageName: 'Courses',        pageUrl: '/courses',        isPublic: true  },
  { pageSlug: 'about',         pageName: 'About',          pageUrl: '/about',          isPublic: true  },
  { pageSlug: 'contact',       pageName: 'Contact',        pageUrl: '/contact',        isPublic: true  },
  { pageSlug: 'blog',          pageName: 'Blog',           pageUrl: '/blog',           isPublic: true  },
  { pageSlug: 'login',         pageName: 'Login',          pageUrl: '/login',          isPublic: false },
  { pageSlug: 'register',      pageName: 'Register',       pageUrl: '/register',       isPublic: false },
  { pageSlug: 'financial-aid', pageName: 'Financial Aid',  pageUrl: '/financial-aid',  isPublic: true  },
  { pageSlug: 'privacy',       pageName: 'Privacy Policy', pageUrl: '/privacy',        isPublic: true  },
  { pageSlug: 'terms',         pageName: 'Terms of Service',pageUrl: '/terms',         isPublic: true  },
]

// Ensure all default pages exist in DB
async function seedDefaults() {
  const slugs = DEFAULT_PAGES.map(p => p.pageSlug)
  const existing = await Seo.find({ pageSlug: { $in: slugs } }).select('pageSlug')
  const existingSlugs = new Set(existing.map(e => e.pageSlug))
  const toInsert = DEFAULT_PAGES.filter(p => !existingSlugs.has(p.pageSlug))
  if (toInsert.length > 0) await Seo.insertMany(toInsert)
}

// ─── GET all pages (list) ─────────────────────────────────────────────────────
export const getAllPages = asyncHandler(async (req, res) => {
  await seedDefaults()
  const pages = await Seo.find().sort({ pageSlug: 1 }).select(
    'pageSlug pageName pageUrl isPublic metaTitle metaDescription metaKeywords og twitter robots sitemap lastModified'
  )
  res.json({ success: true, data: pages })
})

// ─── GET single page ──────────────────────────────────────────────────────────
export const getPage = asyncHandler(async (req, res) => {
  const { slug } = req.params
  let page = await Seo.findOne({ pageSlug: slug })
  if (!page) {
    const def = DEFAULT_PAGES.find(p => p.pageSlug === slug)
    if (!def) throw new NotFoundError('SEO page not found')
    page = await Seo.create(def)
  }
  res.json({ success: true, data: page })
})

// ─── PUT upsert page ──────────────────────────────────────────────────────────
export const upsertPage = asyncHandler(async (req, res) => {
  const { slug } = req.params
  const body = req.body

  // Validate schema markup is valid JSON if provided
  if (body.schemaMarkup && body.schemaMarkup.trim()) {
    try { JSON.parse(body.schemaMarkup) }
    catch { throw new BadRequestError('Schema markup must be valid JSON-LD') }
  }

  const page = await Seo.findOneAndUpdate(
    { pageSlug: slug },
    { ...body, pageSlug: slug, lastModified: new Date() },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  )
  res.json({ success: true, message: 'SEO settings saved', data: page })
})

// ─── POST create custom page ──────────────────────────────────────────────────
export const createPage = asyncHandler(async (req, res) => {
  const { pageSlug, pageName, pageUrl } = req.body
  if (!pageSlug || !pageName) throw new BadRequestError('pageSlug and pageName are required')

  const existing = await Seo.findOne({ pageSlug: pageSlug.toLowerCase().trim() })
  if (existing) throw new BadRequestError('A page with this slug already exists')

  const page = await Seo.create({ pageSlug: pageSlug.toLowerCase().trim(), pageName, pageUrl: pageUrl || '/' })
  res.status(201).json({ success: true, message: 'Page created', data: page })
})

// ─── DELETE custom page ───────────────────────────────────────────────────────
export const deletePage = asyncHandler(async (req, res) => {
  const { slug } = req.params
  const isDefault = DEFAULT_PAGES.some(p => p.pageSlug === slug)
  if (isDefault) throw new BadRequestError('Default pages cannot be deleted')

  const page = await Seo.findOneAndDelete({ pageSlug: slug })
  if (!page) throw new NotFoundError('SEO page not found')
  res.json({ success: true, message: 'Page deleted' })
})

// ─── GET public SEO for a URL (used by frontend to inject meta tags) ──────────
export const getPublicSeo = asyncHandler(async (req, res) => {
  const { slug } = req.params
  const [page, global] = await Promise.all([
    Seo.findOne({ pageSlug: slug }),
    Seo.findOne({ pageSlug: '__global__' }),
  ])
  res.json({ success: true, data: { page: page || null, global: global || null } })
})
