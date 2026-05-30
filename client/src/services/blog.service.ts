import { axiosClient } from '../lib/axiosClient';
import type { Blog, CreateBlogDto, UpdateBlogDto, BlogListResponse, BlogSingleResponse, ApiResponse } from '../types/api';

export const blogService = {
  async getAllBlogs(params?: {
    tag?: string; search?: string; page?: number; limit?: number;
  }): Promise<BlogListResponse> {
    const response = await axiosClient.get<BlogListResponse>('/blogs', { params });
    return response.data;
  },

  async getAdminBlogs(params?: {
    status?: string; search?: string; page?: number; limit?: number;
  }): Promise<BlogListResponse> {
    const response = await axiosClient.get<BlogListResponse>('/blogs/admin/all', { params });
    return response.data;
  },

  async getAdminBlogById(id: string): Promise<BlogSingleResponse> {
    const response = await axiosClient.get<BlogSingleResponse>(`/blogs/admin/${id}`);
    return response.data;
  },

  async getBlogBySlug(slug: string): Promise<BlogSingleResponse> {
    const response = await axiosClient.get<BlogSingleResponse>(`/blogs/${slug}`);
    return response.data;
  },

  async createBlog(data: CreateBlogDto): Promise<BlogSingleResponse> {
    const response = await axiosClient.post<BlogSingleResponse>('/blogs', data);
    return response.data;
  },

  async updateBlog(id: string, data: UpdateBlogDto): Promise<BlogSingleResponse> {
    const response = await axiosClient.patch<BlogSingleResponse>(`/blogs/${id}`, data);
    return response.data;
  },

  async updateBlogCover(id: string, file: File): Promise<{ coverImage: string }> {
    const form = new FormData();
    form.append('image', file);
    const response = await axiosClient.patch<ApiResponse<{ coverImage: string }>>(
      `/blogs/${id}/cover`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data;
  },

  async deleteBlog(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/blogs/${id}`);
    return response.data;
  },
};
