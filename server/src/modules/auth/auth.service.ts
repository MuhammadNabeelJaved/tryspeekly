import User from '../../models/User.model';
import { ApiError } from '../../utils/ApiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail, emailTemplates } from '../../services/email.service';
import env from '../../config/env';

export const authService = {
  async register(data: { name: string; email: string; password: string; phone?: string; country?: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered', 'EMAIL_EXISTS');
    }

    const user = await User.create(data);

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  },

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken
    };
  },

  async refreshTokens(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      return { message: 'If email exists, reset OTP has been sent' };
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    user.passwordResetOtp = await bcrypt.hash(otp, env.BCRYPT_ROUNDS);
    user.passwordResetExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const template = emailTemplates.passwordResetOtp(user.name, otp);
    await sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
    });

    return { message: 'If email exists, reset OTP has been sent' };
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await User.findOne({ email }).select('+passwordResetOtp +passwordResetExpiry');

    if (!user || !user.passwordResetOtp || !user.passwordResetExpiry) {
      throw new ApiError(400, 'Invalid or expired OTP', 'INVALID_OTP');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new ApiError(400, 'OTP has expired', 'EXPIRED_OTP');
    }

    const isValid = await bcrypt.compare(otp, user.passwordResetOtp);
    if (!isValid) {
      throw new ApiError(400, 'Invalid OTP', 'INVALID_OTP');
    }

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return { message: 'Password reset successful' };
  },

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
    return { message: 'Logged out successfully' };
  },
};
