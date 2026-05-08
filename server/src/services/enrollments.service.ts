import Enrollment from '../models/Enrollment.model';
import Course from '../models/Course.model';
import Payment from '../models/Payment.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

export const enrollmentsService = {
  /**
   * Enroll student in a course (student only)
   * Requires approved payment for the course
   */
  async enrollInCourse(studentId: string, courseId: string) {
    // Validate course ID
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.status !== 'published') {
      throw new ApiError(
        400,
        'Course is not available for enrollment',
        'COURSE_NOT_AVAILABLE'
      );
    }

    // Check for approved payment
    const approvedPayment = await Payment.findOne({
      student: studentId,
      course: courseId,
      status: 'approved',
    });

    if (!approvedPayment) {
      throw new ApiError(
        400,
        'No approved payment found for this course',
        'NO_APPROVED_PAYMENT'
      );
    }

    // Check for duplicate enrollment
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true,
    });

    if (existingEnrollment) {
      throw new ApiError(
        409,
        'You are already enrolled in this course',
        'ALREADY_ENROLLED'
      );
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      teacher: course.teacher,
      payment: approvedPayment._id,
      isActive: true,
      progress: {
        sessionsAttended: 0,
        totalSessions: course.totalSessions,
      },
    });

    return {
      id: enrollment._id.toString(),
      student: enrollment.student,
      course: enrollment.course,
      teacher: enrollment.teacher,
      payment: enrollment.payment,
      enrolledAt: enrollment.enrolledAt,
      isActive: enrollment.isActive,
      progress: enrollment.progress,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  },

  /**
   * Get all enrollments for a student with optional status filter
   */
  async getEnrollments(studentId: string, status?: string) {
    const query: Record<string, unknown> = { student: studentId };

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'cancelled') {
      query.isActive = false;
    }

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title description price currency type level focus totalSessions sessionDuration thumbnail teacher')
      .populate('teacher', 'name email photo')
      .sort({ createdAt: -1 })
      .lean();

    return enrollments;
  },

  /**
   * Get single enrollment by ID (student or teacher)
   */
  async getEnrollmentById(enrollmentId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      throw new ApiError(400, 'Invalid enrollment ID', 'INVALID_ENROLLMENT_ID');
    }

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course', 'title description price currency type level focus totalSessions sessionDuration thumbnail')
      .populate('student', 'name email photo')
      .populate('teacher', 'name email photo')
      .lean();

    if (!enrollment) {
      throw new ApiError(404, 'Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }

    // Check authorization (student or teacher)
    if (
      enrollment.student._id.toString() !== userId &&
      enrollment.teacher._id.toString() !== userId
    ) {
      throw new ApiError(
        403,
        'Not authorized to access this enrollment',
        'UNAUTHORIZED'
      );
    }

    return {
      id: enrollment._id.toString(),
      student: enrollment.student,
      course: enrollment.course,
      teacher: enrollment.teacher,
      payment: enrollment.payment,
      enrolledAt: enrollment.enrolledAt,
      isActive: enrollment.isActive,
      progress: enrollment.progress,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  },

  /**
   * Cancel enrollment (student only, before 50% completion)
   */
  async cancelEnrollment(enrollmentId: string, studentId: string) {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      throw new ApiError(400, 'Invalid enrollment ID', 'INVALID_ENROLLMENT_ID');
    }

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      throw new ApiError(404, 'Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }

    // Check ownership
    if (enrollment.student.toString() !== studentId) {
      throw new ApiError(
        403,
        'Not authorized to cancel this enrollment',
        'UNAUTHORIZED'
      );
    }

    // Check if already cancelled
    if (!enrollment.isActive) {
      throw new ApiError(
        400,
        'Enrollment is already cancelled',
        'ALREADY_CANCELLED'
      );
    }

    // Business rule: Cannot cancel after 50% completion
    const completionPercentage =
      (enrollment.progress.sessionsAttended / enrollment.progress.totalSessions) * 100;

    if (completionPercentage >= 50) {
      throw new ApiError(
        400,
        'Cannot cancel enrollment after completing 50% of sessions',
        'CANNOT_CANCEL'
      );
    }

    enrollment.isActive = false;
    await enrollment.save();

    return {
      id: enrollment._id.toString(),
      isActive: enrollment.isActive,
      message: 'Enrollment cancelled successfully',
    };
  },

  /**
   * Complete a session (teacher only)
   */
  async completeSession(
    enrollmentId: string,
    teacherId: string,
    sessionNumber: number
  ) {
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      throw new ApiError(400, 'Invalid enrollment ID', 'INVALID_ENROLLMENT_ID');
    }

    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      throw new ApiError(404, 'Enrollment not found', 'ENROLLMENT_NOT_FOUND');
    }

    // Check authorization (teacher of the course)
    if (enrollment.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'Not authorized to update this enrollment',
        'UNAUTHORIZED'
      );
    }

    // Validate session number
    if (sessionNumber > enrollment.progress.totalSessions) {
      throw new ApiError(
        400,
        'Session number exceeds total sessions',
        'INVALID_SESSION_NUMBER'
      );
    }

    // Update progress
    enrollment.progress.sessionsAttended = sessionNumber;
    enrollment.progress.lastAttendedAt = new Date();
    await enrollment.save();

    return {
      id: enrollment._id.toString(),
      progress: enrollment.progress,
      updatedAt: enrollment.updatedAt,
    };
  },

  /**
   * Get all students enrolled in a course (teacher only, own courses)
   */
  async getCourseStudents(courseId: string, teacherId: string) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new ApiError(400, 'Invalid course ID', 'INVALID_COURSE_ID');
    }

    // Check if course exists and teacher owns it
    const course = await Course.findById(courseId);

    if (!course) {
      throw new ApiError(404, 'Course not found', 'COURSE_NOT_FOUND');
    }

    if (course.teacher.toString() !== teacherId) {
      throw new ApiError(
        403,
        'Not authorized to view students for this course',
        'UNAUTHORIZED'
      );
    }

    // Get all enrollments for the course
    const enrollments = await Enrollment.find({
      course: courseId,
      isActive: true,
    })
      .populate('student', 'name email photo')
      .sort({ createdAt: -1 })
      .lean();

    return enrollments;
  },
};
