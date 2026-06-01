import express from 'express'
import { authenticate } from '../middlewares/auth.js'
import { ForbiddenError } from '../utils/apiErrors.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getAllBlogs,
  getAdminBlogs,
  getAdminBlogById,
  getBlog,
  getBlogComments,
  createBlogComment,
  getAdminBlogComments,
  updateBlogCommentStatus,
  deleteBlogComment,
  createBlog,
  updateBlog,
  updateBlogCover,
  deleteBlog,
} from '../controllers/blog.controller.js'

const router = express.Router()

// ─── Inline helper: teacher, admin, or team_member with 'blog' permission ─────
const authorizeBlog = (req, res, next) => {
  if (!req.user) throw new ForbiddenError('Access denied. Not authenticated.')
  if (['teacher', 'admin'].includes(req.user.role)) return next()
  if (req.user.role === 'team_member' && req.user.permissions.includes('blog')) return next()
  throw new ForbiddenError('Access denied. You do not have permission to manage blogs.')
}

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllBlogs)

// ─── Admin routes (must be before /:slug to avoid shadowing) ──────────────────
router.route('/admin/all').get(authenticate, authorizeBlog, getAdminBlogs)
router.route('/admin/comments').get(authenticate, authorizeBlog, getAdminBlogComments)
router.route('/admin/comments/:id')
  .patch(authenticate, authorizeBlog, updateBlogCommentStatus)
  .delete(authenticate, authorizeBlog, deleteBlogComment)
router.route('/admin/:id').get(authenticate, authorizeBlog, getAdminBlogById)

router.route('/:slug/comments')
  .get(getBlogComments)
  .post(authenticate, createBlogComment)
router.route('/:slug').get(getBlog)

// ─── Teacher/Admin/Blog-team routes ───────────────────────────────────────────
router.route('/').post(authenticate, authorizeBlog, createBlog)
router.route('/:id').patch(authenticate, authorizeBlog, updateBlog)
router.route('/:id/cover').patch(authenticate, authorizeBlog, uploadProfileImage, handleMulterError, updateBlogCover)
router.route('/:id').delete(authenticate, authorizeBlog, deleteBlog)

export default router
