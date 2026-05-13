import { axiosClient } from '../lib/axiosClient';
import type { FAQ, ApiResponse } from '../types/api';

export const faqsService = {
  async getAll(params?: { category?: string }): Promise<{ success: boolean; data: FAQ[] }> {
    const response = await axiosClient.get<{ success: boolean; data: FAQ[] }>('/faqs', { params });
    return response.data;
  },

  async create(dto: Partial<FAQ>): Promise<ApiResponse<FAQ>> {
    const response = await axiosClient.post<ApiResponse<FAQ>>('/faqs', dto);
    return response.data;
  },

  async update(id: string, dto: Partial<FAQ>): Promise<ApiResponse<FAQ>> {
    const response = await axiosClient.patch<ApiResponse<FAQ>>(`/faqs/${id}`, dto);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await axiosClient.delete<ApiResponse<null>>(`/faqs/${id}`);
    return { message: response.data.message || 'Deleted' };
  },

  async reorder(orders: { id: string; order: number }[]): Promise<{ message: string }> {
    const response = await axiosClient.patch<ApiResponse<null>>('/faqs/reorder', { orders });
    return { message: response.data.message || 'Reordered' };
  },
};
