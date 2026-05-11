import { axiosClient } from '../lib/axiosClient';
import type { Payment, CreatePaymentDto, VerifyPaymentDto } from '../types/api';

export const paymentsService = {
  async createPayment(
    dto: CreatePaymentDto
  ): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments/create',
      dto
    );
    return response.data;
  },

  async verifyPayment(
    dto: VerifyPaymentDto
  ): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      '/payments/verify',
      dto
    );
    return response.data;
  },

  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: Payment[]; pagination?: any }> {
    const response = await axiosClient.get<{
      success: boolean;
      data: Payment[];
      pagination?: any;
    }>('/payments', { params });
    return response.data;
  },

  async getPaymentById(
    id: string
  ): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.get<{ success: boolean; data: Payment }>(
      `/payments/${id}`
    );
    return response.data;
  },

  async requestRefund(
    id: string,
    reason: string
  ): Promise<{ success: boolean; data: Payment }> {
    const response = await axiosClient.post<{ success: boolean; data: Payment }>(
      `/payments/${id}/refund`,
      { reason }
    );
    return response.data;
  },

  async getEarnings(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: any }> {
    const response = await axiosClient.get<{ success: boolean; data: any }>(
      '/payments/earnings',
      { params }
    );
    return response.data;
  },
};