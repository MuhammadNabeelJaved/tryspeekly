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
  getInstructorAssignments,
} from '../controllers/assignment.controller.js'

const router = express.Router()

// Static/specific paths must be registered before /:id to avoid shadowing
router.route('/').post(authenticate, authorize('teacher', 'admin'), createAssignment)
router.route('/instructor/my').get(authenticate, authorize('teacher', 'admin'), getInstructorAssignments)
router.route('/course/:courseId').get(authenticate, getCourseAssignments)

router
  .route('/:id')
  .get(authenticate, getAssignment)
  .delete(authenticate, authorize('teacher', 'admin'), deleteAssignment)

router.route('/:id/submit').post(authenticate, authorize('student'), uploadDocument, handleMulterError, submitAssignment)
router.route('/:id/submissions/:submissionId/grade').patch(authenticate, authorize('teacher', 'admin'), gradeSubmission)

export default router
