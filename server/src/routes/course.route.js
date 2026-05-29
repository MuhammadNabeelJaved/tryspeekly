import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { uploadImageFile, uploadVideoFile, handleMulterError } from '../middlewares/multer.js'
import {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseThumbnail,
  updateCourseVideoPreview,
  deleteCourse,
  getTeacherCourses,
  getAdminCourses,
  reviewCourse,
  submitCourseForReview,
  getMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  getSyllabus,
  addSyllabusTopic,
  updateSyllabusTopic,
  deleteSyllabusTopic,
} from '../controllers/course.controller.js'

const router = express.Router()

// ─── Public routes ─────────────────────────────────────────────────────────────
router.route('/').get(getAllCourses)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherCourses)
router.route('/').post(authenticate, authorize('teacher', 'admin'), createCourse)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/admin/all').get(authenticate, authorizeTeamPage('courses'), getAdminCourses)

// ─── Parameterised routes (must come AFTER all specific paths) ─────────────────
router.route('/:id').get(getCourse)
router.route('/:id').patch(authenticate, authorize('teacher', 'admin'), updateCourse)
router.route('/:id/thumbnail').patch(authenticate, authorize('teacher', 'admin'), uploadImageFile, handleMulterError, updateCourseThumbnail)
router.route('/:id/video-preview').patch(authenticate, authorize('teacher', 'admin'), uploadVideoFile, handleMulterError, updateCourseVideoPreview)
router.route('/:id/submit').patch(authenticate, authorize('teacher'), submitCourseForReview)
router.route('/:id/review').patch(authenticate, authorizeTeamPage('courses'), reviewCourse)
router.route('/:id').delete(authenticate, authorizeTeamPage('courses'), deleteCourse)

// ─── Materials ─────────────────────────────────────────────────────────────────
router.route('/:id/materials').get(authenticate, getMaterials)
router.route('/:id/materials').post(authenticate, authorize('teacher', 'admin'), addMaterial)
router.route('/:id/materials/:materialId').patch(authenticate, authorize('teacher', 'admin'), updateMaterial)
router.route('/:id/materials/:materialId').delete(authenticate, authorize('teacher', 'admin'), deleteMaterial)

// ─── Syllabus ──────────────────────────────────────────────────────────────────
router.route('/:id/syllabus').get(getSyllabus)
router.route('/:id/syllabus').post(authenticate, authorize('teacher', 'admin'), addSyllabusTopic)
router.route('/:id/syllabus/:topicId').patch(authenticate, authorize('teacher', 'admin'), updateSyllabusTopic)
router.route('/:id/syllabus/:topicId').delete(authenticate, authorize('teacher', 'admin'), deleteSyllabusTopic)

export default router
