import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  getAllPages, getPage, upsertPage, createPage, deletePage, getPublicSeo,
} from '../controllers/seo.controller.js'

const router = Router()

// Public — frontend injects meta tags
router.get('/public/:slug', getPublicSeo)

// Admin only
router.use(authenticate, authorizeTeamPage('seo'))

router.route('/')
  .get(getAllPages)
  .post(createPage)

router.route('/:slug')
  .get(getPage)
  .put(logActivity('update', 'seo', (req) => ({ resourceName: req.params.slug, details: `Updated SEO for /${req.params.slug}` })), upsertPage)
  .delete(deletePage)

export default router
