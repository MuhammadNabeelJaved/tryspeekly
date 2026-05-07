import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../src/middleware/authenticate';
import { generateAccessToken } from '../../../src/utils/jwt';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/testDb';
import { createTestStudent } from '../../fixtures/users.fixture';

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-secret-32-characters-long-abcd';
  await connectTestDB();
}, 120000);

afterAll(async () => {
  await disconnectTestDB();
}, 30000);

beforeEach(async () => {
  await clearTestDB();
});

describe('authenticate middleware', () => {
  it('should attach user to request with valid token', async () => {
    const user = await createTestStudent();
    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe(user._id.toString());
    expect(req.user?.email).toBe(user.email);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject request with no token', async () => {
    const req = { headers: {} } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
      code: 'UNAUTHORIZED',
    }));
  });

  it('should reject invalid token', async () => {
    const req = {
      headers: { authorization: 'Bearer invalid-token' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });

  it('should reject token for inactive user', async () => {
    const user = await createTestStudent();
    const token = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    user.isActive = false;
    await user.save();

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    await authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});
