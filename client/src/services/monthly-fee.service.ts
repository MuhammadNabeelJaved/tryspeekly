import { axiosClient } from '../lib/axiosClient';
import type { MonthlyFee, MonthlyFeeListResponse, ApiResponse } from '../types/api';

export const monthlyFeeService = {
  async getFees(params?: {
    studentId?: string; courseId?: string; enrollmentId?: string;
    month?: number; year?: number; status?: string; page?: number; limit?: number;
  }): Promise<MonthlyFeeListResponse> {
    const response = await axiosClient.get<MonthlyFeeListResponse>('/monthly-fees', { params });
    return response.data;
  },

  async addFee(dto: {
    enrollmentId: string; month: number; year: number; amount: number;
    currency?: string; method?: string; status?: string;
    dueDate?: string; paidDate?: string; adminNote?: string;
  }): Promise<ApiResponse<MonthlyFee>> {
    const response = await axiosClient.post<ApiResponse<MonthlyFee>>('/monthly-fees', dto);
    return response.data;
  },

  async generateFees(dto: {
    enrollmentId: string; startMonth: number; startYear: number;
    months: number; amount: number; currency?: string; dayOfMonth?: number;
  }): Promise<ApiResponse<{ created: MonthlyFee[]; skipped: string[] }>> {
    const response = await axiosClient.post('/monthly-fees/generate', dto);
    return response.data;
  },

  async updateFee(id: string, dto: {
    amount?: number; currency?: string; method?: string; status?: string;
    dueDate?: string; paidDate?: string; adminNote?: string;
  }): Promise<ApiResponse<MonthlyFee>> {
    const response = await axiosClient.patch<ApiResponse<MonthlyFee>>(`/monthly-fees/${id}`, dto);
    return response.data;
  },

  async deleteFee(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete(`/monthly-fees/${id}`);
    return response.data;
  },

  async getMyFees(): Promise<ApiResponse<MonthlyFee[]>> {
    const response = await axiosClient.get<ApiResponse<MonthlyFee[]>>('/monthly-fees/my');
    return response.data;
  },
};
