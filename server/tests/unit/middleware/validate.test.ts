import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validate } from '../../../src/middleware/validate';
import { ApiError } from '../../../src/utils/ApiError';

describe('validate middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next if validation passes', async () => {
    mockRequest.body = { email: 'test@example.com' };
    const validations = [body('email').isEmail()];

    const middleware = validate(validations);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should call next with ApiError if validation fails', async () => {
    mockRequest.body = { email: 'invalid-email' };
    const validations = [body('email').isEmail().withMessage('Invalid email')];

    const middleware = validate(validations);
    await middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
