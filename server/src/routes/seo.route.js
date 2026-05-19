import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getAllPages, getPage, upsertPage, createPage, deletePage, getPublicSeo,
} from '../controllers/seo.controller.js'

const router = Router()

// Public — frontend injects meta tags
router.get('/public/:slug', getPublicSeo)

// Admin only
router.use(authenticate, authorize('admin'))

router.route('/')
  .get(getAllPages)
  .post(createPage)

router.route('/:slug')
  .get(getPage)
  .put(upsertPage)
  .delete(deletePage)

export default router
