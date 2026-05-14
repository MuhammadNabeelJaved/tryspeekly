import { axiosClient } from '../lib/axiosClient';
import type { User, UpdateProfileDto, ChangePasswordDto, ApiResponse, ApiPaginatedResponse } from '../types/api';

/** Normalize backend user (_id, profileImage) to frontend shape */
export const normalizeUser = (raw: any): User => ({
  ...raw,
  id: raw._id,
  photo: raw.profileImage,
});

export const usersService = {
  async getProfile(): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>('/users/profile');
    return normalizeUser(response.data.data);
  },

  async updateProfile(dto: UpdateProfileDto): Promise<User> {
    const response = await axiosClient.patch<ApiResponse<User>>('/users/profile', dto);
    return normalizeUser(response.data.data);
  },

  async updateProfileImage(file: File): Promise<{ profileImage: string }> {
    const form = new FormData();
    form.append('profileImage', file);
    const response = await axiosClient.patch<ApiResponse<{ profileImage: string }>>(
      '/users/profile/image',
      form
    );
    return response.data.data;
  },

  async changePassword(dto: ChangePasswordDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<null>>('/users/change-password', dto);
    return { message: response.data.message || 'Password changed' };
  },

  async getUserById(id: string): Promise<User> {
    const response = await axiosClient.get<ApiResponse<User>>(`/users/${id}`);
    return normalizeUser(response.data.data);
  },

  async getAllUsers(params?: { page?: number; limit?: number; role?: string; search?: string }): Promise<ApiPaginatedResponse<User>> {
    const response = await axiosClient.get<ApiPaginatedResponse<User>>('/users', { params });
    return { ...response.data, data: response.data.data.map(normalizeUser) };
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/users/${id}`);
    return { message: response.data.message || 'User deleted' };
  },
};
