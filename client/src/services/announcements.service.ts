import { axiosClient } from '../lib/axiosClient';
import type { Announcement, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const announcementsService = {
  async getMyAnnouncements(): Promise<{ success: boolean; data: Announcement[] }> {
    const response = await axiosClient.get<{ success: boolean; data: Announcement[] }>('/announcements');
    return response.data;
  },

  async getAllAnnouncements(params?: { page?: number; limit?: number }): Promise<ApiPaginatedResponse<Announcement>> {
    const response = await axiosClient.get<ApiPaginatedResponse<Announcement>>('/announcements/all', { params });
    return response.data;
  },

  async create(dto: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    const response = await axiosClient.post<ApiResponse<Announcement>>('/announcements', dto);
    return response.data;
  },

  async update(id: string, dto: Partial<Announcement>): Promise<ApiResponse<Announcement>> {
    const response = await axiosClient.patch<ApiResponse<Announcement>>(`/announcements/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/announcements/${id}`);
    return { message: response.data.message || 'Deleted' };
  },
};
