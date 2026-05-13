import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  updateBlogCover,
  deleteBlog,
} from '../controllers/blog.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllBlogs)
router.route('/:slug').get(getBlog)

// ─── Teacher/Admin routes ──────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('teacher', 'admin'), createBlog)
router.route('/:id').patch(authenticate, authorize('teacher', 'admin'), updateBlog)
router.route('/:id/cover').patch(authenticate, authorize('teacher', 'admin'), uploadProfileImage, handleMulterError, updateBlogCover)
router.route('/:id').delete(authenticate, authorize('teacher', 'admin'), deleteBlog)

export default router
