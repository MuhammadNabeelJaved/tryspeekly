import { axiosClient } from '../lib/axiosClient';

import type {
  ApiResponse,
  SalaryPackage,
  SalaryPayment,
  CreateSalaryPackageDto,
  UpdateSalaryPackageDto,
  CreateSalaryPaymentDto,
  UpdateSalaryPaymentDto,
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
};
