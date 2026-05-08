import { Router } from 'express';
import { enrollmentsController } from '../controllers/enrollments.controller';
import { validateJoi } from '../middleware/validateJoi';
import { enrollmentsValidation } from '../validations/enrollments.validation';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Enroll in a course (student only)
router.post(
  '/',
  authorize('student'),
  validateJoi(enrollmentsValidation.enroll),
  enrollmentsController.enrollInCourse
);

// Get all enrollments for authenticated user
router.get(
  '/',
  validateJoi(enrollmentsValidation.getEnrollments),
  enrollmentsController.getEnrollments
);

// Get single enrollment by ID (student or teacher)
router.get(
  '/:id',
  validateJoi(enrollmentsValidation.getEnrollmentById),
  enrollmentsController.getEnrollmentById
);

// Cancel enrollment (student only)
router.patch(
  '/:id/cancel',
  authorize('student'),
  validateJoi(enrollmentsValidation.cancelEnrollment),
  enrollmentsController.cancelEnrollment
);

// Complete a session (teacher only)
router.patch(
  '/:id/complete-session',
  authorize('teacher'),
  validateJoi(enrollmentsValidation.completeSession),
  enrollmentsController.completeSession
);

export default router;
