import request from 'supertest';
import app from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/testDb';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import { generateAccessToken } from '../../src/utils/jwt';

describe('Courses API Integration Tests', () => {
  let studentToken: string;
  let teacherToken: string;
  let studentId: string;
  let teacherId: string;

  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();

    // Create a test student
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

    // Create a test teacher
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
  });

  describe('POST /api/courses', () => {
    it('should create a course for authenticated teacher', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'English Grammar Basics',
          description: 'Learn fundamental English grammar concepts',
          price: 5000,
          currency: 'PKR',
          type: 'one-to-one',
          level: 'beginner',
          focus: 'grammar',
          totalSessions: 10,
          sessionDuration: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('English Grammar Basics');
      expect(res.body.data.teacher).toBe(teacherId);
      expect(res.body.data.status).toBe('draft');
    });

    it('should return 403 for non-teacher user', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'English Grammar Basics',
          description: 'Learn fundamental English grammar concepts',
          price: 5000,
          currency: 'PKR',
          type: 'one-to-one',
          level: 'beginner',
          focus: 'grammar',
          totalSessions: 10,
          sessionDuration: 60,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/courses')
        .send({
          title: 'English Grammar Basics',
          description: 'Learn fundamental English grammar concepts',
          price: 5000,
          currency: 'PKR',
          type: 'one-to-one',
          level: 'beginner',
          focus: 'grammar',
          totalSessions: 10,
          sessionDuration: 60,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
