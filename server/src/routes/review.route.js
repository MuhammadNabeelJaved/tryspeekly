import express from 'express'

import { authenticate, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
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
  getTeamReviews,
} from '../controllers/review.controller.js'

const router = express.Router()

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/public', getPublicReviews)
router.get('/course/:courseId', getCourseReviews)

// ─── Admin (before /:id to avoid shadowing) ──────────────────────────────────
router.get('/admin', authenticate, authorizeTeamPage('reviews'), getAdminReviews)
router.post('/admin', authenticate, authorizeTeamPage('reviews'), adminCreateReview)
router.patch('/admin/:id/status', authenticate, authorizeTeamPage('reviews'), logActivity('update', 'review', (req) => ({ resourceId: req.params.id, details: `Status → ${req.body.status ?? ''}` })), updateReviewStatus)
router.patch('/admin/:id/feature', authenticate, authorizeTeamPage('reviews'), toggleFeatured)
router.delete('/admin/:id', authenticate, authorizeTeamPage('reviews'), logActivity('delete', 'review', (req) => ({ resourceId: req.params.id, details: 'Deleted review' })), adminDeleteReview)

// ─── Team member: all approved team experience reviews ────────────────────────
router.get('/team', authenticate, getTeamReviews)

// ─── Authenticated user ───────────────────────────────────────────────────────
router.get('/my', authenticate, getMyReviews)
router.get('/my/course/:courseId', authenticate, getMyCourseReview)
router.post('/', authenticate, submitReview)
router.patch('/:id', authenticate, updateReview)
router.delete('/:id', authenticate, deleteReview)

export default router
