// server/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { asyncHandler } from '../utils/asyncHandler';

export const usersController = {
  /**
   * GET /api/users/profile
   * Get authenticated user's profile
   */
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const profile = await usersService.getProfile(userId);

    res.status(200).json({
      success: true,
      data: profile,
    });
  }),

  /**
   * PATCH /api/users/profile
   * Update authenticated user's profile
   */
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updates = req.body;
    const profile = await usersService.updateProfile(userId, updates);

    res.status(200).json({
      success: true,
      data: profile,
    });
  }),

  /**
   * POST /api/users/change-password
   * Change authenticated user's password
   */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;
    const result = await usersService.changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),

  /**
   * GET /api/users/:id
   * Get public user profile by ID
   */
  getUserById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  }),

  /**
   * DELETE /api/users/account
   * Delete authenticated user's account
   */
  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { password } = req.body;
    const result = await usersService.deleteAccount(userId, password);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }),
};
