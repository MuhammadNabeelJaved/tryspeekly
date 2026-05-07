import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../../src/utils/jwt';

describe('JWT Utilities', () => {
  const payload = { userId: '123', email: 'test@test.com', role: 'student' as const };

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-32-characters-long';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-characters-long';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';
  });

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw on invalid token', () => {
      expect(() => verifyAccessToken('invalid')).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(payload);
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(payload.userId);
    });
  });
});
