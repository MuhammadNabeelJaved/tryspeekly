import { axiosClient } from '../lib/axiosClient';
import type { SiteSettings, ApiResponse } from '../types/api';

export const siteSettingsService = {
  async get(): Promise<SiteSettings> {
    const response = await axiosClient.get<ApiResponse<SiteSettings>>('/site-settings');
    return response.data.data;
  },

  async update(dto: Partial<SiteSettings>): Promise<SiteSettings> {
    const response = await axiosClient.patch<ApiResponse<SiteSettings>>('/site-settings', dto);
    return response.data.data;
  },

  async updateLogo(file: File): Promise<{ logoUrl: string }> {
    const form = new FormData();
    form.append('image', file);
    const response = await axiosClient.patch<ApiResponse<{ logoUrl: string }>>(
      '/site-settings/logo',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  async updateBanner(file: File): Promise<{ bannerUrl: string }> {
    const form = new FormData();
    form.append('image', file);
    const response = await axiosClient.patch<ApiResponse<{ bannerUrl: string }>>(
      '/site-settings/banner',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },
};
