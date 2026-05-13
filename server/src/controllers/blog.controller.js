import asyncHandler from '../utils/asyncHandler.js'
import Blog from '../models/blog.model.js'
import { uploadSiteBanner, deleteFile, extractPublicId } from '../utils/cloudinary.js'

// GET /api/v1/blogs — public
export const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query
    const filter = { status: 'published' }
    if (tag) filter.tags = tag
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [blogs, total] = await Promise.all([
      Blog.find(filter).populate('author', 'name profileImage').select('-content').skip(skip).limit(Number(limit)).sort({ publishedAt: -1 }),
      Blog.countDocuments(filter),
    ])

    res.json({
      success: true,
      data: blogs,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/blogs/:slug — public
export const getBlog = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name profileImage bio')
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/blogs — admin/teacher
export const createBlog = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.create({ ...req.body, author: req.user.id })
    res.status(201).json({ success: true, message: 'Blog created successfully', data: blog })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/blogs/:id — admin/author
export const updateBlog = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })

    const isAuthor = blog.author.toString() === req.user.id.toString()
    if (!isAuthor && req.user.role !== 'admin') return res.status(403).json({ success: false, error: { message: 'Not authorized' } })

    Object.assign(blog, req.body)
    await blog.save()

    res.json({ success: true, message: 'Blog updated successfully', data: blog })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/blogs/:id/cover — admin/author
export const updateBlogCover = asyncHandler(async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image provided' } })

    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })

    if (blog.coverImage) {
      const publicId = extractPublicId(blog.coverImage)
      if (publicId) await deleteFile(publicId, 'image')
    }

    const result = await uploadSiteBanner(req.file.buffer, req.params.id)
    blog.coverImage = result.secure_url
    await blog.save()

    res.json({ success: true, message: 'Cover image updated', coverImage: blog.coverImage })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/blogs/:id — admin/author (soft delete)
export const deleteBlog = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })

    if (blog.coverImage) {
      const publicId = extractPublicId(blog.coverImage)
      if (publicId) await deleteFile(publicId, 'image')
    }

    blog.isDeleted = true
    await blog.save()

    res.json({ success: true, message: 'Blog deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})
