import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  getAllPages, getPage, upsertPage, createPage, deletePage, getPublicSeo,
  getSitemap, getRobotsTxt,
} from '../controllers/seo.controller.js'

const router = Router()

// Public — frontend injects meta tags
router.get('/public/:slug', getPublicSeo)
router.get('/sitemap.xml', getSitemap)
router.get('/robots.txt', getRobotsTxt)

// Admin only
router.use(authenticate, authorizeTeamPage('seo'))

router.route('/')
  .get(getAllPages)
  .post(logActivity('create', 'seo', (req) => ({ resourceName: req.body.pageSlug ?? '', details: `Created SEO page ${req.body.pageSlug ?? ''}` })), createPage)

router.route('/:slug')
  .get(getPage)
  .put(logActivity('update', 'seo', (req) => ({ resourceName: req.params.slug, details: `Updated SEO for /${req.params.slug}` })), upsertPage)
  .delete(logActivity('delete', 'seo', (req) => ({ resourceName: req.params.slug, details: `Deleted SEO page ${req.params.slug}` })), deletePage)

export default router
