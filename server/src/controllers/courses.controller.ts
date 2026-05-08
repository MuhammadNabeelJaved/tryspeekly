import { Request, Response } from 'express';
import { coursesService } from '../services/courses.service';
import { asyncHandler } from '../utils/asyncHandler';

export const coursesController = {
  /**
   * POST /api/courses
   * Create a new course (teacher only)
   */
  createCourse: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.userId;
    const courseData = req.body;
    const course = await coursesService.createCourse(teacherId, courseData);

    res.status(201).json({
      success: true,
      data: course,
    });
  }),

  /**
   * GET /api/courses
   * Get all published courses with filtering and pagination
   */
  getAllCourses: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    const result = await coursesService.getAllCourses(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }),

  /**
   * GET /api/courses/:id
   * Get course by ID
   */
  getCourseById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);

    res.status(200).json({
      success: true,
      data: course,
    });
  }),

  /**
   * GET /api/courses/teacher/my-courses
   * Get all courses by teacher (teacher only, own courses)
   */
  getTeacherCourses: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.userId;
    const courses = await coursesService.getTeacherCourses(teacherId);

    res.status(200).json({
      success: true,
      data: courses,
    });
  }),

  /**
   * PATCH /api/courses/:id
   * Update course (teacher only, own courses)
   */
  updateCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    const updates = req.body;
    const course = await coursesService.updateCourse(id, teacherId, updates);

    res.status(200).json({
      success: true,
      data: course,
    });
  }),

  /**
   * DELETE /api/courses/:id
   * Delete course (teacher only, own courses)
   */
  deleteCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    const result = await coursesService.deleteCourse(id, teacherId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),

  /**
   * POST /api/courses/:id/publish
   * Publish course (teacher only, own courses)
   */
  publishCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    const result = await coursesService.publishCourse(id, teacherId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),

  /**
   * POST /api/courses/:id/archive
   * Archive course (teacher only, own courses)
   */
  archiveCourse: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const teacherId = req.user!.userId;
    const result = await coursesService.archiveCourse(id, teacherId);

    res.status(200).json({
      success: true,
      data: result,
    });
  }),
};
