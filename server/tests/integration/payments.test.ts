import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import Payment from '../../src/models/Payment.model';
import Enrollment from '../../src/models/Enrollment.model';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Payments API Integration Tests', () => {
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
  });

  describe('POST /api/payments/create', () => {
    it('should create payment intent successfully', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.amount).toBe(5000);
      expect(res.body.data.currency).toBe('PKR');
      expect(res.body.data.method).toBe('jazzcash');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .send({
          courseId: courseId,
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 for teacher role', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          courseId: courseId,
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
        });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: '507f1f77bcf86cd799439011',
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(404);
    });

    it('should return 400 for unpublished course', async () => {
      await Course.findByIdAndUpdate(courseId, { status: 'draft' });

      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for amount mismatch', async () => {
      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          amount: 3000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate pending payment', async () => {
      await Payment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        method: 'jazzcash',
        transactionId: 'PENDING',
        screenshotUrl: '',
        amount: 5000,
        currency: 'PKR',
        status: 'pending',
      });

      const res = await request(app)
        .post('/api/payments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: courseId,
          amount: 5000,
          currency: 'PKR',
          paymentMethod: 'jazzcash',
        });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/payments/verify', () => {
    beforeEach(async () => {
      const payment = await Payment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        method: 'jazzcash',
        transactionId: 'PENDING',
        screenshotUrl: '',
        amount: 5000,
        currency: 'PKR',
        status: 'pending',
      });

      paymentId = payment._id.toString();
    });

    it('should verify payment successfully', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          paymentId: paymentId,
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('approved');
      expect(res.body.data.transactionId).toBe('TXN123456');
      expect(res.body.data.screenshotUrl).toBe('https://example.com/screenshot.jpg');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .send({
          paymentId: paymentId,
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 for teacher role', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          paymentId: paymentId,
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          paymentId: '507f1f77bcf86cd799439011',
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(404);
    });

    it('should return 403 when verifying another students payment', async () => {
      const otherStudent = await User.create({
        name: 'Other Student',
        email: 'other@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const otherToken = generateAccessToken({
        userId: otherStudent._id.toString(),
        email: otherStudent.email,
        role: otherStudent.role,
      });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          paymentId: paymentId,
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for already verified payment', async () => {
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'approved',
        transactionId: 'TXN000000',
        screenshotUrl: 'https://example.com/old.jpg',
      });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          paymentId: paymentId,
          transactionId: 'TXN123456',
          screenshotUrl: 'https://example.com/screenshot.jpg',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments', () => {
    beforeEach(async () => {
      await Payment.create([
        {
          student: studentId,
          course: courseId,
          teacher: teacherId,
          method: 'jazzcash',
          transactionId: 'TXN001',
          screenshotUrl: 'https://example.com/screenshot1.jpg',
          amount: 5000,
          currency: 'PKR',
          status: 'pending',
        },
        {
          student: studentId,
          course: courseId,
          teacher: teacherId,
          method: 'easypaisa',
          transactionId: 'TXN002',
          screenshotUrl: 'https://example.com/screenshot2.jpg',
          amount: 5000,
          currency: 'PKR',
          status: 'approved',
        },
      ]);
    });

    it('should get all payments for student', async () => {
      const res = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });

    it('should filter payments by status', async () => {
      const res = await request(app)
        .get('/api/payments?status=approved')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('approved');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/payments');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/payments/:id', () => {
    beforeEach(async () => {
      const payment = await Payment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        method: 'jazzcash',
        transactionId: 'TXN123',
        screenshotUrl: 'https://example.com/screenshot.jpg',
        amount: 5000,
        currency: 'PKR',
        status: 'approved',
      });

      paymentId = payment._id.toString();
    });

    it('should get payment by ID for student', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(paymentId);
    });

    it('should get payment by ID for teacher', async () => {
      const res = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(paymentId);
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .get('/api/payments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for unauthorized access', async () => {
      const otherStudent = await User.create({
        name: 'Other Student',
        email: 'other@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const otherToken = generateAccessToken({
        userId: otherStudent._id.toString(),
        email: otherStudent.email,
        role: otherStudent.role,
      });

      const res = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get(`/api/payments/${paymentId}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/payments/:id/refund', () => {
    beforeEach(async () => {
      const payment = await Payment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        method: 'jazzcash',
        transactionId: 'TXN123',
        screenshotUrl: 'https://example.com/screenshot.jpg',
        amount: 5000,
        currency: 'PKR',
        status: 'approved',
        verifiedAt: new Date(),
      });

      paymentId = payment._id.toString();
    });

    it('should request refund successfully within 7 days', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('refundRequested');
      expect(res.body.data.refundRequested).toBe(true);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(401);
    });

    it('should return 403 for teacher role', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent payment', async () => {
      const res = await request(app)
        .post('/api/payments/507f1f77bcf86cd799439011/refund')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(404);
    });

    it('should return 403 for unauthorized student', async () => {
      const otherStudent = await User.create({
        name: 'Other Student',
        email: 'other@example.com',
        password: 'Password123!',
        role: 'student',
      });

      const otherToken = generateAccessToken({
        userId: otherStudent._id.toString(),
        email: otherStudent.email,
        role: otherStudent.role,
      });

      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(403);
    });

    it('should return 400 for pending payment', async () => {
      await Payment.findByIdAndUpdate(paymentId, { status: 'pending' });

      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for refund after 7 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8);
      await Payment.findByIdAndUpdate(paymentId, { verifiedAt: oldDate });

      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when course has started', async () => {
      await Enrollment.create({
        student: studentId,
        course: courseId,
        teacher: teacherId,
        payment: paymentId,
        isActive: true,
        progress: {
          sessionsAttended: 1,
          totalSessions: 10,
        },
      });

      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'Course schedule does not match my availability',
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing reason', async () => {
      const res = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/payments/earnings', () => {
    beforeEach(async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      await Payment.create([
        {
          student: studentId,
          course: courseId,
          teacher: teacherId,
          method: 'jazzcash',
          transactionId: 'TXN001',
          screenshotUrl: 'https://example.com/screenshot1.jpg',
          amount: 5000,
          currency: 'PKR',
          status: 'approved',
          verifiedAt: new Date(),
        },
        {
          student: studentId,
          course: courseId,
          teacher: teacherId,
          method: 'easypaisa',
          transactionId: 'TXN002',
          screenshotUrl: 'https://example.com/screenshot2.jpg',
          amount: 3000,
          currency: 'PKR',
          status: 'approved',
          verifiedAt: oldDate,
        },
        {
          student: studentId,
          course: courseId,
          teacher: teacherId,
          method: 'jazzcash',
          transactionId: 'TXN003',
          screenshotUrl: 'https://example.com/screenshot3.jpg',
          amount: 2000,
          currency: 'PKR',
          status: 'pending',
        },
      ]);
    });

    it('should calculate teacher earnings (80/20 split)', async () => {
      const res = await request(app)
        .get('/api/payments/earnings')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalEarnings');
      expect(res.body.data).toHaveProperty('platformFee');
      expect(res.body.data).toHaveProperty('netEarnings');
      // Total approved: 8000, Platform fee: 1600 (20%), Net: 6400 (80%)
      expect(res.body.data.totalEarnings).toBe(8000);
      expect(res.body.data.platformFee).toBe(1600);
      expect(res.body.data.netEarnings).toBe(6400);
    });

    it('should filter earnings by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 15);

      const res = await request(app)
        .get(`/api/payments/earnings?startDate=${startDate.toISOString()}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Only recent payment: 5000, Platform fee: 1000, Net: 4000
      expect(res.body.data.totalEarnings).toBe(5000);
      expect(res.body.data.platformFee).toBe(1000);
      expect(res.body.data.netEarnings).toBe(4000);
    });

    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app).get('/api/payments/earnings');

      expect(res.status).toBe(401);
    });

    it('should return 403 for student role', async () => {
      const res = await request(app)
        .get('/api/payments/earnings')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
