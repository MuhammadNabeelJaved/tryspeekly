import { Router } from 'express';
import { coursesController } from '../controllers/courses.controller';
import { enrollmentsController } from '../controllers/enrollments.controller';
import { validateJoi } from '../middleware/validateJoi';
import { coursesValidation } from '../validations/courses.validation';
import { enrollmentsValidation } from '../validations/enrollments.validation';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all published courses (students and teachers)
router.get(
  '/',
  validateJoi(coursesValidation.list),
  coursesController.getAllCourses
);

// Teacher-only routes (MUST come before /:id to avoid conflicts)
// Get teacher's own courses
router.get(
  '/teacher/my-courses',
  authorize('teacher'),
  coursesController.getTeacherCourses
);

// Create course (teacher only)
router.post(
  '/',
  authorize('teacher'),
  validateJoi(coursesValidation.create),
  coursesController.createCourse
);

// Get course by ID (students and teachers)
router.get(
  '/:id',
  validateJoi(coursesValidation.getById),
  coursesController.getCourseById
);

// Update course (teacher only, own courses)
router.patch(
  '/:id',
  authorize('teacher'),
  validateJoi(coursesValidation.update),
  coursesController.updateCourse
);

// Delete course (teacher only, own courses)
router.delete(
  '/:id',
  authorize('teacher'),
  validateJoi(coursesValidation.delete),
  coursesController.deleteCourse
);

// Publish course (teacher only, own courses)
router.post(
  '/:id/publish',
  authorize('teacher'),
  validateJoi(coursesValidation.publish),
  coursesController.publishCourse
);

// Archive course (teacher only, own courses)
router.post(
  '/:id/archive',
  authorize('teacher'),
  validateJoi(coursesValidation.archive),
  coursesController.archiveCourse
);

// Get students enrolled in a course (teacher only, own courses)
router.get(
  '/:courseId/students',
  authorize('teacher'),
  validateJoi(enrollmentsValidation.getStudents),
  enrollmentsController.getCourseStudents
);

export default router;
