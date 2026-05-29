import { axiosClient } from '../lib/axiosClient';

import type {
  Review,
  SubmitReviewDto,
  UpdateReviewDto,
  AdminUpdateReviewStatusDto,
  AdminCreateReviewDto,
  ReviewListResponse,
  ReviewSingleResponse,
} from '../types/api';

export const reviewsService = {
  async getPublicReviews(): Promise<ReviewListResponse> {
    const response = await axiosClient.get<ReviewListResponse>('/reviews/public');
    return response.data;
  },

  async getCourseReviews(
    courseId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ReviewListResponse> {
    const response = await axiosClient.get<ReviewListResponse>(
      `/reviews/course/${courseId}`,
      { params }
    );
    return response.data;
  },

  async submitReview(data: SubmitReviewDto): Promise<ReviewSingleResponse> {
    const response = await axiosClient.post<ReviewSingleResponse>('/reviews', data);
    return response.data;
  },

  async getMyReviews(): Promise<ReviewListResponse> {
    const response = await axiosClient.get<ReviewListResponse>('/reviews/my');
    return response.data;
  },

  async getMyCourseReview(courseId: string): Promise<ReviewSingleResponse> {
    const response = await axiosClient.get<ReviewSingleResponse>(
      `/reviews/my/course/${courseId}`
    );
    return response.data;
  },

  async updateReview(id: string, data: UpdateReviewDto): Promise<ReviewSingleResponse> {
    const response = await axiosClient.patch<ReviewSingleResponse>(`/reviews/${id}`, data);
    return response.data;
  },

  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{
      success: boolean;
      message: string;
    }>(`/reviews/${id}`);
    return response.data;
  },

  async getAdminReviews(params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ReviewListResponse> {
    const response = await axiosClient.get<ReviewListResponse>('/reviews/admin', { params });
    return response.data;
  },

  async updateReviewStatus(
    id: string,
    data: AdminUpdateReviewStatusDto
  ): Promise<ReviewSingleResponse> {
    const response = await axiosClient.patch<ReviewSingleResponse>(
      `/reviews/admin/${id}/status`,
      data
    );
    return response.data;
  },

  async toggleFeatured(id: string): Promise<ReviewSingleResponse> {
    const response = await axiosClient.patch<ReviewSingleResponse>(
      `/reviews/admin/${id}/feature`,
      {}
    );
    return response.data;
  },

  async adminDeleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{
      success: boolean;
      message: string;
    }>(`/reviews/admin/${id}`);
    return response.data;
  },

  async adminCreateReview(data: AdminCreateReviewDto): Promise<ReviewSingleResponse> {
    const response = await axiosClient.post<ReviewSingleResponse>('/reviews/admin', data);
    return response.data;
  },

  async getTeamReviews(params?: { page?: number; limit?: number }): Promise<ReviewListResponse> {
    const response = await axiosClient.get<ReviewListResponse>('/reviews/team', { params });
    return response.data;
  },
};
