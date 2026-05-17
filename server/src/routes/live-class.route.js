import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  createLiveClass,
  updateLiveClass,
  completeLiveClass,
  cancelLiveClass,
  getActiveLiveClasses,
  getLiveClassByCourse,
  getTeacherLiveClasses,
  getTeacherCompletedClasses,
  scheduleClass,
  updateSchedule,
  deleteSchedule,
} from '../controllers/live-class.controller.js'

const router = express.Router()

// IMPORTANT: Specific routes must come before parameterized routes
router.route('/teacher').get(authenticate, authorize('teacher'), getTeacherLiveClasses)
router.route('/teacher/completed').get(authenticate, authorize('teacher'), getTeacherCompletedClasses)
router.route('/active').get(getActiveLiveClasses)
router.route('/course/:courseId').get(getLiveClassByCourse)
router.route('/schedule').post(authenticate, authorize('teacher'), scheduleClass)
router.route('/').post(authenticate, authorize('teacher'), createLiveClass)
router.route('/:id').patch(authenticate, authorize('teacher'), updateLiveClass)
router.route('/:id/complete').patch(authenticate, authorize('teacher'), completeLiveClass)
router.route('/:id/cancel').patch(authenticate, authorize('teacher'), cancelLiveClass)
router.route('/:id/reschedule').patch(authenticate, authorize('teacher'), updateSchedule)
router.route('/:id/schedule').delete(authenticate, authorize('teacher'), deleteSchedule)

export default router
