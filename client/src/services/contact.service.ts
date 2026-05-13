import { axiosClient } from '../lib/axiosClient';
import type { ContactDto, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const contactService = {
  async submit(dto: ContactDto): Promise<{ message: string }> {
    const response = await axiosClient.post<ApiResponse<any>>('/contact', dto);
    return { message: response.data.message || 'Message sent successfully' };
  },

  async getAllMessages(params?: { page?: number; limit?: number; isRead?: boolean }): Promise<ApiPaginatedResponse<any>> {
    const response = await axiosClient.get<ApiPaginatedResponse<any>>('/contact', { params });
    return response.data;
  },

  async getMessage(id: string): Promise<ApiResponse<any>> {
    const response = await axiosClient.get<ApiResponse<any>>(`/contact/${id}`);
    return response.data;
  },

  async markAsRead(id: string): Promise<ApiResponse<any>> {
    const response = await axiosClient.patch<ApiResponse<any>>(`/contact/${id}/read`);
    return response.data;
  },

  async deleteMessage(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/contact/${id}`);
    return { message: response.data.message || 'Deleted' };
  },
};
