import { Router } from 'express'
import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
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
  .put(upsertPage)
  .delete(deletePage)

export default router
