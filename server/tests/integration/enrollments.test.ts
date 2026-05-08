import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import Payment from '../../src/models/Payment.model';
import Enrollment from '../../src/models/Enrollment.model';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Enrollments API Integration Tests', () => {
  let studentToken: string;
  let teacherToken: string;
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
    studentToken = generateAccessToken({
      userId: student._id.toString(),
      email: student.email,
      role: student.role,
    });

    // Create test teacher
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
    });

    teacherId = teacher._id.toString();
    teacherToken = generateAccessToken({
      userId: teacher._id.toString(),
      email: teacher.email,
      role: teacher.role,
    });

    // Create published course
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

  describe('POST /api/enrollments', () => {
    it('should enroll student in course successfully', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.toString()).toBe(studentId);
      expect(res.body.data.course.toString()).toBe(courseId);
      expect(res.body.data.isActive).toBe(true);
      expect(res.body.data.progress.sessionsAttended).toBe(0);
      expect(res.body.data.progress.totalSessions).toBe(10);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 403 for non-student user', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid course ID', async () => {
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: 'invalid-id',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if no approved payment exists', async () => {
      await Payment.deleteMany({ student: studentId, course: courseId });

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('payment');
    });

    it('should return 409 if already enrolled', async () => {
      // First enrollment
      await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
        });

      // Second enrollment should fail
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already enrolled');
    });
  });

  describe('GET /api/enrollments', () => {
    it('should get all enrollments for authenticated student', async () => {
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

      const res = await request(app)
        .get('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].course).toHaveProperty('title');
    });

    it('should filter by active status', async () => {
      await Enrollment.create({
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

      const res = await request(app)
        .get('/api/enrollments?status=active')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/enrollments');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/enrollments/:id', () => {
    it('should get enrollment by ID for student', async () => {
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

      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.sessionsAttended).toBe(3);
    });

    it('should get enrollment by ID for teacher', async () => {
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

      const res = await request(app)
        .get(`/api/enrollments/${enrollment._id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.sessionsAttended).toBe(3);
    });

    it('should return 404 if enrollment not found', async () => {
      const res = await request(app)
        .get('/api/enrollments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
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

      const res = await request(app).get(`/api/enrollments/${enrollment._id}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/enrollments/:id/cancel', () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
      expect(res.body.data.message).toContain('cancelled');
    });

    it('should return 400 if more than 50% completed', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('50%');
    });

    it('should return 403 for non-student user', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/cancel`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
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

      const res = await request(app).patch(`/api/enrollments/${enrollment._id}/cancel`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/enrollments/:id/complete-session', () => {
    it('should complete a session for teacher', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/complete-session`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionNumber: 4,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress.sessionsAttended).toBe(4);
      expect(res.body.data.progress.lastAttendedAt).toBeDefined();
    });

    it('should return 400 if session number exceeds total sessions', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/complete-session`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          sessionNumber: 11,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('exceeds');
    });

    it('should return 403 for non-teacher user', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/complete-session`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionNumber: 3,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
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

      const res = await request(app)
        .patch(`/api/enrollments/${enrollment._id}/complete-session`)
        .send({
          sessionNumber: 1,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/courses/:courseId/students', () => {
    it('should get all students enrolled in course for teacher', async () => {
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

      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].student).toHaveProperty('name');
      expect(res.body.data[0].progress.sessionsAttended).toBe(2);
    });

    it('should return 403 for non-teacher user', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get(`/api/courses/${courseId}/students`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return empty array if no enrollments', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/students`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });
});
