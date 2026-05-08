// server/tests/utils/testHelpers.ts
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.model';
import Course from '../../src/models/Course.model';
import Enrollment from '../../src/models/Enrollment.model';
import Message from '../../src/models/Message.model';
import Payment from '../../src/models/Payment.model';

/**
 * Create a test user with optional overrides
 */
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    role: 'student',
    isEmailVerified: true,
  };

  return User.create({ ...defaultUser, ...overrides });
};

/**
 * Generate JWT token for a user
 */
export const generateToken = (user: any) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

/**
 * Clear all test data from database
 */
export const clearDatabase = async () => {
  await User.deleteMany({});
  await Course.deleteMany({});
  await Enrollment.deleteMany({});
  await Message.deleteMany({});
  await Payment.deleteMany({});
};

/**
 * Create a test course
 */
export const createTestCourse = async (teacher: any, overrides: any = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'This is a test course for automated testing',
    price: 5000,
    currency: 'PKR',
    type: 'one-on-one',
    level: 'beginner',
    focus: 'grammar',
    teacher: teacher._id,
    totalSessions: 10,
    sessionDuration: 60,
    status: 'published',
    enrolledStudents: [],
  };

  return Course.create({ ...defaultCourse, ...overrides });
};
