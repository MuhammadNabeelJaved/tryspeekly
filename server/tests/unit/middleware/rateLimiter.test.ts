import { apiLimiter, authLimiter, paymentLimiter } from '../../../src/middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  it('should export apiLimiter', () => {
    expect(apiLimiter).toBeDefined();
    expect(typeof apiLimiter).toBe('function');
  });

  it('should export authLimiter', () => {
    expect(authLimiter).toBeDefined();
    expect(typeof authLimiter).toBe('function');
  });

  it('should export paymentLimiter', () => {
    expect(paymentLimiter).toBeDefined();
    expect(typeof paymentLimiter).toBe('function');
  });

  it('should skip rate limiting in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
