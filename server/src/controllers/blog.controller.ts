import { Request, Response } from 'express';
import { blogService } from '../services/blog.service';
import { asyncHandler } from '../utils/asyncHandler';

export const blogController = {
  createBlog: asyncHandler(async (req: Request, res: Response) => {
    const authorId = req.user!.userId;
    const blogData = req.body;
    const blog = await blogService.createBlog(authorId, blogData);

    res.status(201).json({
      success: true,
      data: blog,
    });
  }),

  getAllBlogs: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query;
    // Check if admin to fetch drafts/archived or just published
    const isAdmin = req.user?.role === 'admin';
    const result = await blogService.getAllBlogs({ ...filters, isAdmin });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }),

  getBlogById: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'admin';
    const blog = await blogService.getBlogById(id, isAdmin);

    res.status(200).json({
      success: true,
      data: blog,
    });
  }),

  getBlogBySlug: asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const isAdmin = req.user?.role === 'admin';
    const blog = await blogService.getBlogBySlug(slug, isAdmin);

    res.status(200).json({
      success: true,
      data: blog,
    });
  }),

  updateBlog: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const authorId = req.user!.userId;
    const updates = req.body;
    const isAdmin = req.user?.role === 'admin';
    const blog = await blogService.updateBlog(id, authorId, updates, isAdmin);

    res.status(200).json({
      success: true,
      data: blog,
    });
  }),

  deleteBlog: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const authorId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const result = await blogService.deleteBlog(id, authorId, isAdmin);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  })
};
