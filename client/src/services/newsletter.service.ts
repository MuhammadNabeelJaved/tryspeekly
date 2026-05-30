import { axiosClient } from '../lib/axiosClient';

export interface NewsletterSubscriber {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt: string | null;
}

export interface NewsletterCampaign {
  _id: string;
  subject: string;
  htmlBody: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt: string | null;
  sentAt: string | null;
  totalSent: number;
  totalFailed: number;
  createdBy: string | { name: string; email: string };
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SubscriberListResponse {
  success: boolean;
  data: { subscribers: NewsletterSubscriber[]; pagination: Pagination };
}

interface CampaignListResponse {
  success: boolean;
  data: NewsletterCampaign[];
}

interface CampaignResponse {
  success: boolean;
  message: string;
  data: NewsletterCampaign;
}

interface CreateCampaignDto {
  subject: string;
  htmlBody: string;
  status: 'draft' | 'scheduled';
  scheduledAt?: string;
}

export const newsletterService = {
  subscribe: async (email: string) => {
    const res = await axiosClient.post<{ success: boolean; message: string }>(
      '/newsletter/subscribers',
      { email }
    );
    return res.data;
  },

  getSubscribers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await axiosClient.get<SubscriberListResponse>('/newsletter/subscribers', {
      params,
    });
    return res.data;
  },

  unsubscribeSubscriber: async (id: string) => {
    const res = await axiosClient.patch<{ success: boolean }>(
      `/newsletter/subscribers/${id}/unsubscribe`
    );
    return res.data;
  },

  deleteSubscriber: async (id: string) => {
    await axiosClient.delete(`/newsletter/subscribers/${id}`);
  },

  unsubscribeByToken: async (token: string) => {
    const res = await axiosClient.get<{ success: boolean; message: string }>(
      '/newsletter/unsubscribe',
      { params: { token } }
    );
    return res.data;
  },

  getCampaigns: async () => {
    const res = await axiosClient.get<CampaignListResponse>('/newsletter/campaigns');
    return res.data;
  },

  getCampaign: async (id: string) => {
    const res = await axiosClient.get<CampaignResponse>(`/newsletter/campaigns/${id}`);
    return res.data;
  },

  createCampaign: async (data: CreateCampaignDto) => {
    const res = await axiosClient.post<CampaignResponse>('/newsletter/campaigns', data);
    return res.data;
  },

  updateCampaign: async (id: string, data: Partial<CreateCampaignDto>) => {
    const res = await axiosClient.put<CampaignResponse>(`/newsletter/campaigns/${id}`, data);
    return res.data;
  },

  deleteCampaign: async (id: string) => {
    await axiosClient.delete(`/newsletter/campaigns/${id}`);
  },

  sendCampaign: async (id: string) => {
    const res = await axiosClient.post<{ success: boolean; message: string }>(
      `/newsletter/campaigns/${id}/send`
    );
    return res.data;
  },
};
