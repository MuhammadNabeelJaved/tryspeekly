import express from 'express'

import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getPublicReviews,
  getCourseReviews,
  submitReview,
  getMyReviews,
  getMyCourseReview,
  updateReview,
  deleteReview,
  getAdminReviews,
  updateReviewStatus,
  toggleFeatured,
  adminDeleteReview,
  adminCreateReview,
} from '../controllers/review.controller.js'

const router = express.Router()

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/public', getPublicReviews)
router.get('/course/:courseId', getCourseReviews)

// ─── Admin (before /:id to avoid shadowing) ──────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), getAdminReviews)
router.post('/admin', authenticate, authorize('admin'), adminCreateReview)
router.patch('/admin/:id/status', authenticate, authorize('admin'), updateReviewStatus)
router.patch('/admin/:id/feature', authenticate, authorize('admin'), toggleFeatured)
router.delete('/admin/:id', authenticate, authorize('admin'), adminDeleteReview)

// ─── Authenticated user ───────────────────────────────────────────────────────
router.get('/my', authenticate, getMyReviews)
router.get('/my/course/:courseId', authenticate, getMyCourseReview)
router.post('/', authenticate, submitReview)
router.patch('/:id', authenticate, updateReview)
router.delete('/:id', authenticate, deleteReview)

export default router
