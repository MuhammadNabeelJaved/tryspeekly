import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { ApiError } from '../../../src/utils/ApiError';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    mockRequest = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: statusMock,
    };
    mockNext = jest.fn();
  });

  it('should handle ApiError correctly', () => {
    const error = new ApiError(404, 'Not found', 'NOT_FOUND');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Not found',
      code: 'NOT_FOUND',
    });
  });

  it('should handle ApiError with details', () => {
    const error = new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', [
      { field: 'email', message: 'Invalid email' },
    ]);

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'email', message: 'Invalid email' }],
    });
  });

  it('should handle MongoDB ValidationError', () => {
    const error: any = {
      name: 'ValidationError',
      message: 'Validation failed',
      errors: {
        email: { path: 'email', message: 'Email is required' },
      },
    };

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      fields: [{ field: 'email', message: 'Email is required' }],
    });
  });

  it('should handle JsonWebTokenError', () => {
    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
  });

  it('should handle TokenExpiredError', () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  });

  it('should handle MongoDB duplicate key error', () => {
    const error: any = {
      name: 'MongoError',
      message: 'E11000 duplicate key error',
      code: 11000,
      keyPattern: { email: 1 },
    };

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'email already exists',
      code: 'DUPLICATE_KEY',
    });
  });

  it('should handle MongoDB duplicate key error without keyPattern', () => {
    const error: any = {
      name: 'MongoError',
      message: 'E11000 duplicate key error',
      code: 11000,
    };

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'field already exists',
      code: 'DUPLICATE_KEY',
    });
  });

  it('should handle generic error in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Something went wrong');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Something went wrong',
      code: 'INTERNAL_ERROR',
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should handle generic error in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Something went wrong');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });

    process.env.NODE_ENV = originalEnv;
  });
});
