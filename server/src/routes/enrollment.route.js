import express from 'express'
import { authenticate, authorize, authorizeTeamPage } from '../middlewares/auth.js'
import { logActivity } from '../middlewares/activityLogger.js'
import {
  createEnrollment,
  getMyEnrollments,
  getEnrollment,
  getTeacherEnrollments,
  markAttendance,
  getAllEnrollments,
  getUnpaidEnrollments,
  adminEnrollWithFinancialAid,
  adminManualEnroll,
  getEnrollmentByFinancialAid,
} from '../controllers/enrollment.controller.js'

const router = express.Router()

// ─── Student routes ────────────────────────────────────────────────────────────
router.route('/').post(authenticate, authorize('student'), createEnrollment)
router.route('/my').get(authenticate, authorize('student'), getMyEnrollments)

// ─── Teacher routes ────────────────────────────────────────────────────────────
router.route('/teacher/my').get(authenticate, authorize('teacher', 'admin'), getTeacherEnrollments)

// ─── Admin routes (also visible to team members with students/courses/instructors pages) ───
router.route('/').get(authenticate, authorizeTeamPage('students', 'courses', 'instructors'), getAllEnrollments)
router.route('/admin/unpaid').get(authenticate, authorizeTeamPage('payments'), getUnpaidEnrollments)
router.route('/admin/manual').post(authenticate, authorize('admin'), logActivity('create', 'enrollment', (req) => ({ details: 'Manually enrolled student from admin students page' })), adminManualEnroll)
router.route('/admin/financial-aid').post(authenticate, authorizeTeamPage('students', 'courses', 'instructors'), logActivity('create', 'enrollment', (req) => ({ details: 'Enrolled student via financial aid' })), adminEnrollWithFinancialAid)
router.route('/by-financial-aid/:aidId').get(authenticate, authorizeTeamPage('students', 'courses', 'instructors'), getEnrollmentByFinancialAid)

// ─── Parameterised routes (must come after all static paths) ──────────────────
router.route('/:id/attendance').patch(authenticate, authorize('teacher', 'admin'), markAttendance)
router.route('/:id').get(authenticate, getEnrollment)

export default router
