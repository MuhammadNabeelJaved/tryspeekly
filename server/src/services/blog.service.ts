import mongoose from 'mongoose';
import Blog from '../models/Blog.model';
import { ApiError } from '../utils/ApiError';

interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

interface UpdateBlogData {
  title?: string;
  content?: string;
  excerpt?: string;
  slug?: string;
  coverImage?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
}

interface GetAllBlogsFilters {
  status?: string;
  tag?: string;
  author?: string;
  search?: string;
  page?: number;
  limit?: number;
  isAdmin?: boolean;
}

export const blogService = {
  async createBlog(authorId: string, blogData: CreateBlogData) {
    const dataToCreate: any = {
      ...blogData,
      author: authorId,
    };

    if (blogData.status === 'published') {
      dataToCreate.publishedAt = new Date();
    }

    const blog = await Blog.create(dataToCreate);
    return blog;
  },

  async getAllBlogs(filters: GetAllBlogsFilters) {
    const { status, tag, author, search, page = 1, limit = 10, isAdmin = false } = filters;

    const query: Record<string, any> = {};

    if (!isAdmin) {
      query.status = 'published';
    } else if (status) {
      query.status = status;
    }

    if (tag) query.tags = tag;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email photo')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Blog.countDocuments(query),
    ]);

    return {
      data: blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getBlogById(blogId: string, isAdmin = false) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw new ApiError(400, 'Invalid blog ID', 'INVALID_BLOG_ID');
    }

    const blog = await Blog.findById(blogId).populate('author', 'name email photo').lean();

    if (!blog) {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    if (!isAdmin && blog.status !== 'published') {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    return blog;
  },

  async getBlogBySlug(slug: string, isAdmin = false) {
    const blog = await Blog.findOne({ slug }).populate('author', 'name email photo').lean();

    if (!blog) {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    if (!isAdmin && blog.status !== 'published') {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    return blog;
  },

  async updateBlog(blogId: string, authorId: string, updates: UpdateBlogData, isAdmin = false) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw new ApiError(400, 'Invalid blog ID', 'INVALID_BLOG_ID');
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    if (!isAdmin && blog.author.toString() !== authorId) {
      throw new ApiError(403, 'You are not authorized to update this blog', 'UNAUTHORIZED');
    }

    if (updates.status === 'published' && blog.status !== 'published') {
      blog.publishedAt = new Date();
    }

    Object.assign(blog, updates);

    await blog.save();
    return blog;
  },

  async deleteBlog(blogId: string, authorId: string, isAdmin = false) {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      throw new ApiError(400, 'Invalid blog ID', 'INVALID_BLOG_ID');
    }

    const blog = await Blog.findById(blogId);

    if (!blog) {
      throw new ApiError(404, 'Blog not found', 'BLOG_NOT_FOUND');
    }

    if (!isAdmin && blog.author.toString() !== authorId) {
      throw new ApiError(403, 'You are not authorized to delete this blog', 'UNAUTHORIZED');
    }

    await Blog.findByIdAndDelete(blogId);

    return { message: 'Blog deleted successfully' };
  }
};
