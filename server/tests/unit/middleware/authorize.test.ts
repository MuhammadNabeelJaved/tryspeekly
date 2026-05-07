import { Request, Response, NextFunction } from 'express';
import { authorize } from '../../../src/middleware/authorize';
import { USER_ROLES } from '../../../src/config/constants';

describe('authorize middleware', () => {
  it('should allow user with correct role', () => {
    const req = {
      user: { userId: '123', email: 'test@test.com', role: USER_ROLES.ADMIN, _id: '123' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN, USER_ROLES.TEACHER);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should reject user with wrong role', () => {
    const req = {
      user: { userId: '123', email: 'test@test.com', role: USER_ROLES.STUDENT, _id: '123' },
    } as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 403,
      code: 'FORBIDDEN',
    }));
  });

  it('should reject unauthenticated request', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    const middleware = authorize(USER_ROLES.ADMIN);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 401,
    }));
  });
});
