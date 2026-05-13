import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import { uploadDocument, handleMulterError } from '../middlewares/multer.js'
import {
  createAssignment,
  getCourseAssignments,
  getAssignment,
  submitAssignment,
  gradeSubmission,
  deleteAssignment,
} from '../controllers/assignment.controller.js'

const router = express.Router()

// ─── Teacher/Admin routes ──────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('teacher', 'admin'), createAssignment)
router.route('/:id').delete(authenticate, authorize('teacher', 'admin'), deleteAssignment)
router.route('/:id/submissions/:submissionId/grade').patch(authenticate, authorize('teacher', 'admin'), gradeSubmission)

// ─── Authenticated routes ──────────────────────────────────────────────────────
router.route('/course/:courseId').get(authenticate, getCourseAssignments)
router.route('/:id').get(authenticate, getAssignment)
router.route('/:id/submit').post(authenticate, authorize('student'), uploadDocument, handleMulterError, submitAssignment)

export default router
