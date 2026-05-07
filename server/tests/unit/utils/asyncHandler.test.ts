import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../../src/utils/asyncHandler';

describe('asyncHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call async function and handle success', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const handler = asyncHandler(mockFn);

    await handler(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors and pass to next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(mockFn);

    await handler(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle synchronous errors', async () => {
    const error = new Error('Sync error');
    const mockFn = jest.fn().mockImplementation(() => {
      throw error;
    });
    const handler = asyncHandler(mockFn);

    await handler(mockReq as Request, mockRes as Response, mockNext as NextFunction);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
