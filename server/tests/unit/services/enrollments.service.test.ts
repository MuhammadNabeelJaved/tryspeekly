import { enrollmentsService } from '../../../src/services/enrollments.service';
import User from '../../../src/models/User.model';
import Course from '../../../src/models/Course.model';
import Enrollment from '../../../src/models/Enrollment.model';
import Payment from '../../../src/models/Payment.model';
import { ApiError } from '../../../src/utils/ApiError';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/testDb';
import mongoose from 'mongoose';

describe('enrollmentsService', () => {
  let studentId: string;
  let teacherId: string;
  let courseId: string;
  let paymentId: string;

  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Create test student
    const student = await User.create({
      name: 'Test Student',
      email: 'student@example.com',
      password: 'Password123!',
      role: 'student',
    });
    studentId = student._id.toString();

    // Create test teacher
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherId = teacher._id.toString();

    // Create test course
    const course = await Course.create({
      title: 'English Grammar Basics',
      description: 'Learn fundamental English grammar',
      price: 5000,
      currency: 'PKR',
      type: 'one-to-one',
      level: 'beginner',
      focus: 'grammar',
      totalSessions: 10,
      sessionDuration: 60,
      teacher: teacherId,
      status: 'published',
    });
    courseId = course._id.toString();

    // Create approved payment
    const payment = await Payment.create({
      student: studentId,
      course: courseId,
      teacher: teacherId,
      method: 'jazzcash',
      transactionId: 'TXN123456',
      screenshotUrl: 'https://example.com/screenshot.jpg',
      amount: 5000,
      currency: 'PKR',
      status: 'approved',
      verifiedBy: teacherId,
      verifiedAt: new Date(),
    });
    paymentId = payment._id.toString();
  });

  describe('enrollInCourse', () => {
    it('should enroll student in course successfully', async () => {
      const result = await enrollmentsService.enrollInCourse(studentId, courseId);

      expect(result).toHaveProperty('id');
      expect(result.student.toString()).toBe(studentId);
      expect(result.course.toString()).toBe(courseId);
      expect(result.teacher.toString()).toBe(teacherId);
      expect(result.isActive).toBe(true);
      expect(result.progress.sessionsAttended).toBe(0);
      expect(result.progress.totalSessions).toBe(10);
    });

    it('should throw error if course does not exist', async () => {
      const fakeCourseId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.enrollInCourse(studentId, fakeCourseId))
        .rejects
        .toThrow('Course not found');
    });

    it('should throw error if course is not published', async () => {
      const draftCourse = await Course.create({
        title: 'Draft Course',
        description: 'Not published yet',
        price: 3000,
        currency: 'PKR',
        type: 'group',
        level: 'intermediate',
        focus: 'speaking',
        totalSessions: 8,
        sessionDuration: 45,
        teacher: teacherId,
        status: 'draft',
      });

      await expect(enrollmentsService.enrollInCourse(studentId, draftCourse._id.toString()))
        .rejects
        .toThrow('Course is not available for enrollment');
    });

    it('should throw error if no approved payment exists', async () => {
      // Delete the approved payment
      await Payment.deleteMany({ student: studentId, course: courseId });

      await expect(enrollmentsService.enrollInCourse(studentId, courseId))
        .rejects
        .toThrow('No approved payment found for this course');
    });

    it('should throw error if already enrolled', async () => {
      // First enrollment
      await enrollmentsService.enrollInCourse(studentId, courseId);

      // Second enrollment should fail
      await expect(enrollmentsService.enrollInCourse(studentId, courseId))
        .rejects
        .toThrow('You are already enrolled in this course');
    });

    it('should throw error for invalid course ID', async () => {
      await expect(enrollmentsService.enrollInCourse(studentId, 'invalid-id'))
        .rejects
        .toThrow('Invalid course ID');
    });
  });

  describe('getEnrollments', () => {
    it('should get all active enrollments for student', async () => {
      await enrollmentsService.enrollInCourse(studentId, courseId);

      const result = await enrollmentsService.getEnrollments(studentId, undefined);

      expect(result.length).toBe(1);
      expect(result[0].student.toString()).toBe(studentId);
      expect(result[0].course).toHaveProperty('title');
    });

    it('should filter by active status', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 0,
          totalSessions: 10,
        },
      });

      const result = await enrollmentsService.getEnrollments(studentId, 'active');

      expect(result.length).toBe(1);
      expect(result[0].isActive).toBe(true);
    });

    it('should return empty array if no enrollments', async () => {
      const result = await enrollmentsService.getEnrollments(studentId, undefined);

      expect(result).toEqual([]);
    });
  });

  describe('getEnrollmentById', () => {
    it('should get enrollment by ID', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 2,
          totalSessions: 10,
        },
      });

      const result = await enrollmentsService.getEnrollmentById(
        enrollment._id.toString(),
        studentId
      );

      expect(result.id).toBe(enrollment._id.toString());
      expect(result.progress.sessionsAttended).toBe(2);
    });

    it('should throw error if enrollment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.getEnrollmentById(fakeId, studentId))
        .rejects
        .toThrow('Enrollment not found');
    });

    it('should throw error if user not authorized', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 0,
          totalSessions: 10,
        },
      });

      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.getEnrollmentById(enrollment._id.toString(), otherUserId))
        .rejects
        .toThrow('Not authorized to access this enrollment');
    });

    it('should throw error for invalid enrollment ID', async () => {
      await expect(enrollmentsService.getEnrollmentById('invalid-id', studentId))
        .rejects
        .toThrow('Invalid enrollment ID');
    });
  });

  describe('cancelEnrollment', () => {
    it('should cancel enrollment if less than 50% completed', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 4,
          totalSessions: 10,
        },
      });

      const result = await enrollmentsService.cancelEnrollment(
        enrollment._id.toString(),
        studentId
      );

      expect(result.isActive).toBe(false);
      expect(result.message).toBe('Enrollment cancelled successfully');
    });

    it('should throw error if more than 50% completed', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 6,
          totalSessions: 10,
        },
      });

      await expect(enrollmentsService.cancelEnrollment(enrollment._id.toString(), studentId))
        .rejects
        .toThrow('Cannot cancel enrollment after completing 50% of sessions');
    });

    it('should throw error if enrollment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.cancelEnrollment(fakeId, studentId))
        .rejects
        .toThrow('Enrollment not found');
    });

    it('should throw error if user not authorized', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 2,
          totalSessions: 10,
        },
      });

      const otherUserId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.cancelEnrollment(enrollment._id.toString(), otherUserId))
        .rejects
        .toThrow('Not authorized to cancel this enrollment');
    });

    it('should throw error if enrollment already cancelled', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: false,
        progress: {
          sessionsAttended: 0,
          totalSessions: 10,
        },
      });

      await expect(enrollmentsService.cancelEnrollment(enrollment._id.toString(), studentId))
        .rejects
        .toThrow('Enrollment is already cancelled');
    });
  });

  describe('completeSession', () => {
    it('should complete a session successfully', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 3,
          totalSessions: 10,
        },
      });

      const result = await enrollmentsService.completeSession(
        enrollment._id.toString(),
        teacherId,
        4
      );

      expect(result.progress.sessionsAttended).toBe(4);
      expect(result.progress.lastAttendedAt).toBeDefined();
    });

    it('should throw error if teacher not authorized', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 2,
          totalSessions: 10,
        },
      });

      const otherTeacherId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.completeSession(
        enrollment._id.toString(),
        otherTeacherId,
        3
      ))
        .rejects
        .toThrow('Not authorized to update this enrollment');
    });

    it('should throw error if session number exceeds total sessions', async () => {
      const enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 5,
          totalSessions: 10,
        },
      });

      await expect(enrollmentsService.completeSession(
        enrollment._id.toString(),
        teacherId,
        11
      ))
        .rejects
        .toThrow('Session number exceeds total sessions');
    });

    it('should throw error if enrollment not found', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.completeSession(fakeId, teacherId, 1))
        .rejects
        .toThrow('Enrollment not found');
    });
  });

  describe('getCourseStudents', () => {
    it('should get all students enrolled in course', async () => {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 2,
          totalSessions: 10,
        },
      });

      const result = await enrollmentsService.getCourseStudents(courseId, teacherId);

      expect(result.length).toBe(1);
      expect(result[0].student).toHaveProperty('name');
      expect(result[0].progress.sessionsAttended).toBe(2);
    });

    it('should throw error if teacher not authorized', async () => {
      const otherTeacherId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.getCourseStudents(courseId, otherTeacherId))
        .rejects
        .toThrow('Not authorized to view students for this course');
    });

    it('should throw error if course not found', async () => {
      const fakeCourseId = new mongoose.Types.ObjectId().toString();

      await expect(enrollmentsService.getCourseStudents(fakeCourseId, teacherId))
        .rejects
        .toThrow('Course not found');
    });

    it('should return empty array if no enrollments', async () => {
      const result = await enrollmentsService.getCourseStudents(courseId, teacherId);

      expect(result).toEqual([]);
    });
  });
});
