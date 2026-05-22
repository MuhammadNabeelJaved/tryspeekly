import { axiosClient } from '../lib/axiosClient';

import type {
  ApiResponse,
  SalaryPackage,
  SalaryPayment,
  SalaryRequest,
  CreateSalaryPackageDto,
  UpdateSalaryPackageDto,
  CreateSalaryPaymentDto,
  UpdateSalaryPaymentDto,
  CreateSalaryRequestDto,
  AdminResolveSalaryRequestDto,
} from '../types/api';

export const salaryService = {
  async getAllPackages(): Promise<ApiResponse<SalaryPackage[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryPackage[]>>(
      '/salaries'
    );
    return response.data;
  },

  async createPackage(
    data: CreateSalaryPackageDto
  ): Promise<ApiResponse<SalaryPackage>> {
    const response = await axiosClient.post<ApiResponse<SalaryPackage>>(
      '/salaries',
      data
    );
    return response.data;
  },

  async updatePackage(
    id: string,
    data: UpdateSalaryPackageDto
  ): Promise<ApiResponse<SalaryPackage>> {
    const response = await axiosClient.patch<ApiResponse<SalaryPackage>>(
      `/salaries/${id}`,
      data
    );
    return response.data;
  },

  async deletePackage(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{
      success: boolean;
      message: string;
    }>(`/salaries/${id}`);
    return response.data;
  },

  async getPackagePayments(
    packageId: string
  ): Promise<ApiResponse<SalaryPayment[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryPayment[]>>(
      `/salaries/${packageId}/payments`
    );
    return response.data;
  },

  async addPayment(
    packageId: string,
    data: CreateSalaryPaymentDto
  ): Promise<ApiResponse<SalaryPayment>> {
    const response = await axiosClient.post<ApiResponse<SalaryPayment>>(
      `/salaries/${packageId}/payments`,
      data
    );
    return response.data;
  },

  async updatePayment(
    packageId: string,
    paymentId: string,
    data: UpdateSalaryPaymentDto
  ): Promise<ApiResponse<SalaryPayment>> {
    const response = await axiosClient.patch<ApiResponse<SalaryPayment>>(
      `/salaries/${packageId}/payments/${paymentId}`,
      data
    );
    return response.data;
  },

  async deletePayment(
    packageId: string,
    paymentId: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{
      success: boolean;
      message: string;
    }>(`/salaries/${packageId}/payments/${paymentId}`);
    return response.data;
  },

  async getMyPackage(): Promise<
    ApiResponse<{ package: SalaryPackage | null; payments: SalaryPayment[] }>
  > {
    const response = await axiosClient.get<
      ApiResponse<{ package: SalaryPackage | null; payments: SalaryPayment[] }>
    >('/salaries/my');
    return response.data;
  },

  async createRequest(data: CreateSalaryRequestDto): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.post<ApiResponse<SalaryRequest>>(
      '/salary-requests',
      data
    );
    return response.data;
  },

  async getMyRequests(): Promise<ApiResponse<SalaryRequest[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryRequest[]>>(
      '/salary-requests/my'
    );
    return response.data;
  },

  async cancelRequest(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(
      `/salary-requests/${id}`
    );
    return response.data;
  },

  async getAllRequests(params?: { status?: string; teacher?: string }): Promise<ApiResponse<SalaryRequest[]>> {
    const response = await axiosClient.get<ApiResponse<SalaryRequest[]>>(
      '/salary-requests',
      { params }
    );
    return response.data;
  },

  async approveRequest(
    id: string,
    data: AdminResolveSalaryRequestDto
  ): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.patch<ApiResponse<SalaryRequest>>(
      `/salary-requests/${id}/approve`,
      data
    );
    return response.data;
  },

  async rejectRequest(
    id: string,
    data: AdminResolveSalaryRequestDto
  ): Promise<ApiResponse<SalaryRequest>> {
    const response = await axiosClient.patch<ApiResponse<SalaryRequest>>(
      `/salary-requests/${id}/reject`,
      data
    );
    return response.data;
  },
};
