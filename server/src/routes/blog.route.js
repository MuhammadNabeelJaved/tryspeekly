import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getAllBlogs,
  getAdminBlogs,
  getBlog,
  createBlog,
  updateBlog,
  updateBlogCover,
  deleteBlog,
} from '../controllers/blog.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllBlogs)

// ─── Admin routes (must be before /:slug to avoid shadowing) ──────────────────
router.route('/admin/all').get(authenticate, authorize('admin', 'teacher'), getAdminBlogs)

router.route('/:slug').get(getBlog)

// ─── Teacher/Admin routes ──────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('teacher', 'admin'), createBlog)
router.route('/:id').patch(authenticate, authorize('teacher', 'admin'), updateBlog)
router.route('/:id/cover').patch(authenticate, authorize('teacher', 'admin'), uploadProfileImage, handleMulterError, updateBlogCover)
router.route('/:id').delete(authenticate, authorize('teacher', 'admin'), deleteBlog)

export default router
