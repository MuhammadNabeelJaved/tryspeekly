import { ApiError } from '../../../src/utils/ApiError';

describe('ApiError', () => {
  it('should create error with all properties', () => {
    const error = new ApiError(404, 'Not found', 'NOT_FOUND', [{ field: 'id', message: 'Invalid ID' }]);

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.details).toEqual([{ field: 'id', message: 'Invalid ID' }]);
    expect(error.name).toBe('ApiError');
  });

  it('should work without details', () => {
    const error = new ApiError(500, 'Server error', 'SERVER_ERROR');

    expect(error.statusCode).toBe(500);
    expect(error.details).toBeUndefined();
  });
});
