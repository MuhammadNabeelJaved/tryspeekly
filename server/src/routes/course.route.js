import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadProfileImage, handleMulterError } from '../middlewares/multer.js'
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseThumbnail,
  deleteCourse,
  getTeacherCourses,
  getAdminCourses,
  reviewCourse,
  submitCourseForReview,
} from '../controllers/course.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllCourses)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherCourses)
router.route('/').post(authenticate, authorize('teacher', 'admin'), createCourse)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/admin/all').get(authenticate, authorize('admin'), getAdminCourses)

// ─── Parameterised routes (must come AFTER all specific paths) ─────────────────
router.route('/:id').get(getCourse)
router.route('/:id').patch(authenticate, authorize('teacher', 'admin'), updateCourse)
router.route('/:id/thumbnail').patch(authenticate, authorize('teacher', 'admin'), uploadProfileImage, handleMulterError, updateCourseThumbnail)
router.route('/:id/submit').patch(authenticate, authorize('teacher'), submitCourseForReview)
router.route('/:id/review').patch(authenticate, authorize('admin'), reviewCourse)
router.route('/:id').delete(authenticate, authorize('admin'), deleteCourse)

export default router
