import { Request, Response } from 'express';
import { enrollmentsService } from '../services/enrollments.service';
import { asyncHandler } from '../utils/asyncHandler';

export const enrollmentsController = {
  /**
   * POST /api/enrollments
   * Enroll in a course (student only)
   */
  enrollInCourse: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.userId;
    const { courseId } = req.body;
    const enrollment = await enrollmentsService.enrollInCourse(studentId, courseId);

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  }),

  /**
   * GET /api/enrollments
   * Get all enrollments for authenticated user
   */
  getEnrollments: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { status } = req.query;
    const enrollments = await enrollmentsService.getEnrollments(
      userId,
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: enrollments,
    });
  }),

  /**
   * GET /api/enrollments/:id
   * Get single enrollment by ID (student or teacher)
   */
  getEnrollmentById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;
    const enrollment = await enrollmentsService.getEnrollmentById(id, userId);

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  }),

  /**
   * PATCH /api/enrollments/:id/cancel
   * Cancel enrollment (student only)
   */
  cancelEnrollment: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const studentId = req.user!.userId;
    const result = await enrollmentsService.cancelEnrollment(id, studentId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  /**
   * PATCH /api/enrollments/:id/complete-session
   * Complete a session (teacher only)
   */
  completeSession: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    const { sessionNumber } = req.body;
    const result = await enrollmentsService.completeSession(
      id,
      teacherId,
      sessionNumber
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  /**
   * GET /api/courses/:courseId/students
   * Get all students enrolled in a course (teacher only)
   */
  getCourseStudents: asyncHandler(async (req: Request, res: Response) => {
    const { courseId } = req.params;
    const teacherId = req.user!.userId;
    const students = await enrollmentsService.getCourseStudents(courseId, teacherId);

    res.status(200).json({
      success: true,
      data: students,
    });
  }),
};
