import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createEnrollment,
  getMyEnrollments,
  getEnrollment,
  getTeacherEnrollments,
  markAttendance,
  getAllEnrollments,
  adminEnrollWithFinancialAid,
  getEnrollmentByFinancialAid,
} from '../controllers/enrollment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), createEnrollment)
router.route('/my').get(authenticate, authorize('student'), getMyEnrollments)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherEnrollments)

// ─── Admin only routes ─────────────────────────────────────────────────────────
router.route('/').get(authenticate, authorize('admin'), getAllEnrollments)
router.route('/admin/financial-aid').post(authenticate, authorize('admin'), adminEnrollWithFinancialAid)
router.route('/by-financial-aid/:aidId').get(authenticate, authorize('admin', 'student'), getEnrollmentByFinancialAid)

// ─── Parameterised routes (must come after all static paths) ──────────────────
router.route('/:id/attendance').patch(authenticate, authorize('teacher', 'admin'), markAttendance)
router.route('/:id').get(authenticate, getEnrollment)

export default router
