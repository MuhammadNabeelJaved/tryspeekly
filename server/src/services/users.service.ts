import User from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import bcrypt from 'bcryptjs';
import env from '../config/env';

export const usersService = {
  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string) {
    const user = await User.findById(userId).select('-password -refreshToken -passwordResetOtp -passwordResetExpiry');

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      bio: user.bio,
      photo: user.photo,
      specializations: user.specializations,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: { name?: string; bio?: string; avatar?: string }) {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Update allowed fields
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.avatar !== undefined) user.photo = updates.avatar;

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      bio: user.bio,
      photo: user.photo,
      specializations: user.specializations,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
  },

  /**
   * Get public user profile by ID (limited fields)
   */
  async getUserById(userId: string) {
    const user = await User.findById(userId).select('name email role bio photo specializations isActive createdAt');

    if (!user || !user.isActive) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      photo: user.photo,
      specializations: user.specializations,
      createdAt: user.createdAt,
    };
  },

  /**
   * Delete user account (soft delete by setting isActive to false)
   */
  async deleteAccount(userId: string, password: string) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Password is incorrect', 'INVALID_PASSWORD');
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    return { message: 'Account deleted successfully' };
  },
};
