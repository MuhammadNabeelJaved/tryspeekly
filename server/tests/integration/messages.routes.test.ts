import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import Enrollment from '../../src/models/Enrollment.model';
import Payment from '../../src/models/Payment.model';
import Message from '../../src/models/Message.model';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Messages Routes Integration Tests', () => {
  let student1Token: string;
  let student2Token: string;
  let teacherToken: string;
  let student1Id: string;
  let student2Id: string;
  let teacherId: string;
  let courseId: string;

  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Create teacher
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@example.com',
      password: 'Password123!',
      role: 'teacher',
    });
    teacherId = teacher._id.toString();
    teacherToken = generateAccessToken({
      userId: teacherId,
      email: teacher.email,
      role: teacher.role,
    });

    // Create two students
    const student1 = await User.create({
      name: 'Student One',
      email: 'student1@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student1Id = student1._id.toString();
    student1Token = generateAccessToken({
      userId: student1Id,
      email: student1.email,
      role: student1.role,
    });

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@example.com',
      password: 'Password123!',
      role: 'student',
    });
    student2Id = student2._id.toString();
    student2Token = generateAccessToken({
      userId: student2Id,
      email: student2.email,
      role: student2.role,
    });

    // Create course
    const course = await Course.create({
      title: 'English Grammar',
      description: 'Learn grammar',
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

    // Create payments and enrollments
    const payment1 = await Payment.create({
      student: student1Id,
      course: courseId,
      teacher: teacherId,
      method: 'jazzcash',
      transactionId: 'TXN001',
      screenshotUrl: 'https://example.com/screenshot1.jpg',
      amount: 5000,
      currency: 'PKR',
      status: 'approved',
      verifiedBy: teacherId,
      verifiedAt: new Date(),
    });

    const payment2 = await Payment.create({
      student: student2Id,
      course: courseId,
      teacher: teacherId,
      method: 'jazzcash',
      transactionId: 'TXN002',
      screenshotUrl: 'https://example.com/screenshot2.jpg',
      amount: 5000,
      currency: 'PKR',
      status: 'approved',
      verifiedBy: teacherId,
      verifiedAt: new Date(),
    });

    await Enrollment.create({
      student: student1Id,
      course: courseId,
      teacher: teacherId,
      payment: payment1._id,
      isActive: true,
      progress: {
        sessionsAttended: 0,
        totalSessions: 10,
      },
    });

    await Enrollment.create({
      student: student2Id,
      course: courseId,
      teacher: teacherId,
      payment: payment2._id,
      isActive: true,
      progress: {
        sessionsAttended: 0,
        totalSessions: 10,
      },
    });
  });

  describe('POST /api/messages', () => {
    it('should send message between enrolled students', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: student2Id,
          content: 'Hello, how are you?',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe('Hello, how are you?');
      expect(response.body.data.isRead).toBe(false);
    });

    it('should allow teacher to message student', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          receiverId: student1Id,
          content: 'Welcome to the course!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('Welcome to the course!');
    });

    it('should allow student to message teacher', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: teacherId,
          content: 'I have a question',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          receiverId: student2Id,
          content: 'Hello',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid receiverId format', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: 'invalid-id',
          content: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: student2Id,
          content: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for content exceeding max length', async () => {
      const longContent = 'a'.repeat(2001);

      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: student2Id,
          content: longContent,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 when trying to message yourself', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          receiverId: student1Id,
          content: 'Hello myself',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/conversations', () => {
    beforeEach(async () => {
      // Create some messages
      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Hello from student 1',
        isRead: false,
        isDeleted: false,
      });

      await Message.create({
        sender: student2Id,
        receiver: student1Id,
        content: 'Reply from student 2',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: teacherId,
        receiver: student1Id,
        content: 'Message from teacher',
        isRead: false,
        isDeleted: false,
      });
    });

    it('should get all conversations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('user');
      expect(response.body.data[0]).toHaveProperty('lastMessage');
      expect(response.body.data[0]).toHaveProperty('unreadCount');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/messages/conversations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages/conversation/:userId', () => {
    beforeEach(async () => {
      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'First message',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: student2Id,
        receiver: student1Id,
        content: 'Reply',
        isRead: true,
        isDeleted: false,
      });

      await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Third message',
        isRead: false,
        isDeleted: false,
      });
    });

    it('should get full conversation with another user', async () => {
      const response = await request(app)
        .get(`/api/messages/conversation/${student2Id}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].content).toBe('First message');
      expect(response.body.data[0].sender).toHaveProperty('name');
      expect(response.body.data[0].receiver).toHaveProperty('name');
    });

    it('should return 400 for invalid userId format', async () => {
      const response = await request(app)
        .get('/api/messages/conversation/invalid-id')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/messages/conversation/${student2Id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/messages/:id/read', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Unread message',
        isRead: false,
        isDeleted: false,
      });
      messageId = message._id.toString();
    });

    it('should mark message as read by receiver', async () => {
      const response = await request(app)
        .patch(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isRead).toBe(true);
      expect(response.body.data.readAt).toBeDefined();

      // Verify in database
      const message = await Message.findById(messageId);
      expect(message?.isRead).toBe(true);
    });

    it('should return 403 if user is not the receiver', async () => {
      const response = await request(app)
        .patch(`/api/messages/${messageId}/read`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid message ID format', async () => {
      const response = await request(app)
        .patch('/api/messages/invalid-id/read')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/api/messages/${messageId}/read`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    let messageId: string;

    beforeEach(async () => {
      const message = await Message.create({
        sender: student1Id,
        receiver: student2Id,
        content: 'Message to delete',
        isRead: false,
        isDeleted: false,
      });
      messageId = message._id.toString();
    });

    it('should soft delete message by sender', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isDeleted).toBe(true);

      // Verify in database (soft delete, not hard delete)
      const message = await Message.findById(messageId);
      expect(message).toBeDefined();
      expect(message?.isDeleted).toBe(true);
      expect(message?.deletedAt).toBeDefined();
    });

    it('should return 403 if user is not the sender', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid message ID format', async () => {
      const response = await request(app)
        .delete('/api/messages/invalid-id')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/messages/${messageId}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
