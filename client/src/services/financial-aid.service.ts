import { axiosClient } from '../lib/axiosClient';
import type { FinancialAid, ApplyFinancialAidDto, ApiResponse, ApiPaginatedResponse } from '../types/api';

export const financialAidService = {
  async apply(dto: ApplyFinancialAidDto): Promise<ApiResponse<FinancialAid>> {
    const response = await axiosClient.post<ApiResponse<FinancialAid>>('/financial-aid', dto);
    return response.data;
  },

  async getMyApplications(): Promise<{ success: boolean; data: FinancialAid[] }> {
    const response = await axiosClient.get<{ success: boolean; data: FinancialAid[] }>('/financial-aid/my');
    return response.data;
  },

  async getAllApplications(params?: { page?: number; limit?: number; status?: string }): Promise<ApiPaginatedResponse<FinancialAid>> {
    const response = await axiosClient.get<ApiPaginatedResponse<FinancialAid>>('/financial-aid', { params });
    return response.data;
  },

  async updateStatus(id: string, status: string, notes?: string, approvedAmount?: number): Promise<ApiResponse<FinancialAid>> {
    const response = await axiosClient.patch<ApiResponse<FinancialAid>>(`/financial-aid/${id}/status`, {
      status, notes, approvedAmount,
    });
    return response.data;
  },
};
