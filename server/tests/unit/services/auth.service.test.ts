import { authService } from '../../../src/services/auth.service';
import User from '../../../src/models/User.model';
import { ApiError } from '../../../src/utils/ApiError';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../helpers/testDb';
import * as jwt from '../../../src/utils/jwt';

jest.mock('../../../src/services/email.service', () => ({
  sendEmail: jest.fn(),
  emailTemplates: {
    passwordResetOtp: jest.fn(() => ({
      subject: 'Reset Password',
      html: '<p>OTP: 123456</p>',
    })),
  },
}));

describe('authService', () => {
  beforeAll(async () => {
    await connectTestDB();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDB();
  }, 30000);

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      const payload = { userId: user._id.toString(), email: user.email, role: user.role };
      const refreshToken = jwt.generateRefreshToken(payload);
      user.refreshToken = refreshToken;
      await user.save();

      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await authService.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(authService.refreshTokens('invalid-token'))
        .rejects
        .toThrow();
    });

    it('should throw error if user does not exist', async () => {
      const payload = { userId: '507f1f77bcf86cd799439011', email: 'fake@example.com', role: 'student' as const };
      const refreshToken = jwt.generateRefreshToken(payload);

      await expect(authService.refreshTokens(refreshToken))
        .rejects
        .toThrow(ApiError);
    });

    it('should throw error if refresh token does not match', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      const payload = { userId: user._id.toString(), email: user.email, role: user.role };
      const oldToken = jwt.generateRefreshToken(payload);
      user.refreshToken = oldToken;
      await user.save();

      await new Promise(resolve => setTimeout(resolve, 1100));

      const newToken = jwt.generateRefreshToken(payload);

      await expect(authService.refreshTokens(newToken))
        .rejects
        .toThrow('Invalid refresh token');
    });
  });

  describe('requestPasswordReset', () => {
    it('should return message even if user does not exist', async () => {
      const result = await authService.requestPasswordReset('nonexistent@example.com');

      expect(result.message).toBe('If email exists, reset OTP has been sent');
    });
  });

  describe('resetPassword', () => {
    it('should throw error if user does not exist', async () => {
      await expect(authService.resetPassword('nonexistent@example.com', '123456', 'NewPassword123!'))
        .rejects
        .toThrow('Invalid or expired OTP');
    });

    it('should throw error if no OTP set', async () => {
      await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      await expect(authService.resetPassword('john@example.com', '123456', 'NewPassword123!'))
        .rejects
        .toThrow('Invalid or expired OTP');
    });
  });

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
      });

      const payload = { userId: user._id.toString(), email: user.email, role: user.role };
      const refreshToken = jwt.generateRefreshToken(payload);
      user.refreshToken = refreshToken;
      await user.save();

      const result = await authService.logout(user._id.toString());

      expect(result.message).toBe('Logged out successfully');

      const updatedUser = await User.findById(user._id).select('+refreshToken');
      expect(updatedUser?.refreshToken).toBeUndefined();
    });
  });
});
