import Course from '../../src/models/Course.model';
import { COURSE_TYPES, COURSE_LEVELS, COURSE_FOCUS, CURRENCIES } from '../../src/config/constants';
import { Types } from 'mongoose';

export const createTestCourse = async (teacherId: Types.ObjectId, overrides = {}) => {
  const defaultCourse = {
    title: 'Test Course',
    description: 'Test course description',
    price: 1000,
    currency: CURRENCIES.PKR,
    type: COURSE_TYPES.GROUP,
    level: COURSE_LEVELS.BEGINNER,
    focus: COURSE_FOCUS.GENERAL,
    totalSessions: 10,
    sessionDuration: 60,
    teacher: teacherId,
    status: 'published' as const,
  };

  return await Course.create({ ...defaultCourse, ...overrides });
};
