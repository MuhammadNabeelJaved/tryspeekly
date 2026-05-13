import { axiosClient } from '../lib/axiosClient';
import type {
  LoginDto, RegisterDto, VerifyEmailDto,
  ForgotPasswordDto, ResetPasswordDto,
  AuthResponse, ApiResponse,
} from '../types/api';

export const authService = {
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<null>>('/users/register', dto);
    return { message: response.data.message || 'Registration successful' };
  },

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/users/verify-email', dto);
    return response.data.data;
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await axiosClient.post<ApiResponse<AuthResponse>>('/users/login', dto);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await axiosClient.post('/users/logout');
  },

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    const response = await axiosClient.post<ApiResponse<{ accessToken: string }>>(
      '/users/refresh-token',
      { refreshToken: token }
    );
    return response.data.data;
  },

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<null>>('/users/forgot-password', dto);
    return { message: response.data.message || 'OTP sent' };
  },

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<null>>('/users/reset-password', dto);
    return { message: response.data.message || 'Password reset successful' };
  },
};
