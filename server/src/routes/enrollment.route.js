import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createEnrollment,
  getMyEnrollments,
  getEnrollment,
  getTeacherEnrollments,
  markAttendance,
  getAllEnrollments,
} from '../controllers/enrollment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), createEnrollment)
router.route('/my').get(authenticate, authorize('student'), getMyEnrollments)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherEnrollments)
router.route('/:id/attendance').patch(authenticate, authorize('teacher', 'admin'), markAttendance)

// ─── Shared (student/teacher/admin) ───────────────────────────────────────────
router.route('/:id').get(authenticate, getEnrollment)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllEnrollments)

export default router
