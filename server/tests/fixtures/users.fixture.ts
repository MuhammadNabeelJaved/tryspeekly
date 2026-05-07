import User from '../../src/models/User.model';
import { USER_ROLES } from '../../src/config/constants';

export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: `test${Date.now()}${Math.random().toString(36).slice(2, 8)}@example.com`,
    password: 'Password123!',
    role: USER_ROLES.STUDENT,
    isActive: true,
  };

  return await User.create({ ...defaultUser, ...overrides });
};

export const createTestStudent = () => createTestUser({ role: USER_ROLES.STUDENT });
export const createTestTeacher = () => createTestUser({ role: USER_ROLES.TEACHER });
export const createTestAdmin = () => createTestUser({ role: USER_ROLES.ADMIN });
