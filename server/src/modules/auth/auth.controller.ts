import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  }),

  refreshTokens: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;
    const result = await authService.refreshTokens(refreshToken);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { accessToken: result.accessToken },
    });
  }),

  requestPasswordReset: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await authService.requestPasswordReset(email);

    res.json({
      success: true,
      data: result,
    });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPassword(email, otp, newPassword);

    res.json({
      success: true,
      data: result,
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req.user!._id);

    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: result,
    });
  }),
};
