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
} from '../controllers/course.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllCourses)
router.route('/:id').get(getCourse)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherCourses)
router.route('/').post(authenticate, authorize('teacher', 'admin'), createCourse)
router.route('/:id').patch(authenticate, authorize('teacher', 'admin'), updateCourse)
router.route('/:id/thumbnail').patch(authenticate, authorize('teacher', 'admin'), uploadProfileImage, handleMulterError, updateCourseThumbnail)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/:id').delete(authenticate, authorize('admin'), deleteCourse)

export default router
