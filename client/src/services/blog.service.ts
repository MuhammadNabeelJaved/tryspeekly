import { axiosClient } from '../lib/axiosClient';
import type { Blog, CreateBlogDto, UpdateBlogDto, BlogListResponse, BlogSingleResponse } from '../types/api';

export const blogService = {
  async getAllBlogs(params?: {
    status?: string;
    tag?: string;
    author?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<BlogListResponse> {
    const response = await axiosClient.get<BlogListResponse>('/blogs', { params });
    return response.data;
  },

  async getBlogById(id: string): Promise<BlogSingleResponse> {
    const response = await axiosClient.get<BlogSingleResponse>(`/blogs/${id}`);
    return response.data;
  },

  async getBlogBySlug(slug: string): Promise<BlogSingleResponse> {
    const response = await axiosClient.get<BlogSingleResponse>(`/blogs/slug/${slug}`);
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

  async deleteBlog(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/blogs/${id}`);
    return response.data;
  }
};
