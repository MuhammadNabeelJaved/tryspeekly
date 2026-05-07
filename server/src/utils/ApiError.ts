export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}
