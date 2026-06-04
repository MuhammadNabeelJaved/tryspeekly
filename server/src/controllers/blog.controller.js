import asyncHandler from '../utils/asyncHandler.js'
import Blog from '../models/blog.model.js'
import BlogComment from '../models/blog-comment.model.js'
import { uploadSiteBanner, deleteFile, extractPublicId } from '../utils/cloudinary.js'
import { pingBlog } from '../utils/indexnow.js'

// GET /api/v1/blogs — public
export const getAllBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10, tag, search } = req.query
    const filter = { status: 'published' }
    if (tag) filter.tags = tag
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [blogs, total] = await Promise.all([
      Blog.find(filter).populate('author', 'name profileImage role jobTitle').select('-content').skip(skip).limit(Number(limit)).sort({ publishedAt: -1 }),
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
    const blog = await Blog.findOne({ slug: req.params.slug }).populate('author', 'name profileImage bio role jobTitle')
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/blogs/:slug/comments — public: approved comments for a blog
export const getBlogComments = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).select('_id')
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })

    const comments = await BlogComment.find({ blog: blog._id, status: 'approved' })
      .populate('author', 'name profileImage role')
      .sort({ createdAt: -1 })

    res.json({ success: true, data: comments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/blogs/:slug/comments — verified users only
export const createBlogComment = asyncHandler(async (req, res) => {
  try {
    const content = String(req.body.content || '').trim()
    if (!content) return res.status(400).json({ success: false, error: { message: 'Comment is required' } })
    if (content.length > 1000) return res.status(400).json({ success: false, error: { message: 'Comment cannot exceed 1000 characters' } })

    const blog = await Blog.findOne({ slug: req.params.slug, status: 'published' }).select('_id')
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })

    const comment = await BlogComment.create({
      blog: blog._id,
      author: req.user.id,
      content,
      status: 'pending',
    })

    await comment.populate('author', 'name profileImage role')

    res.status(201).json({
      success: true,
      message: 'Comment submitted for approval',
      data: comment,
    })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/blogs/admin/all — admin: all blogs regardless of status
export const getAdminBlogs = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query
    const filter = { isDeleted: { $ne: true } }
    if (status && status !== 'all') filter.status = status
    if (search) filter.title = { $regex: search, $options: 'i' }

    const skip = (Number(page) - 1) * Number(limit)
    const [blogs, total] = await Promise.all([
      Blog.find(filter).populate('author', 'name profileImage role jobTitle').select('-content').skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
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

// GET /api/v1/blogs/admin/:id — admin: single blog with full content
export const getAdminBlogById = asyncHandler(async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name profileImage role jobTitle')
    if (!blog) return res.status(404).json({ success: false, error: { message: 'Blog not found' } })
    res.json({ success: true, data: blog })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// GET /api/v1/blogs/admin/comments — admin/blog-team: all comments
export const getAdminBlogComments = asyncHandler(async (req, res) => {
  try {
    const { status = 'all', search, blogId } = req.query
    const filter = { isDeleted: { $ne: true } }
    if (status && status !== 'all') filter.status = status
    if (blogId) filter.blog = blogId

    let comments = await BlogComment.find(filter)
      .populate('author', 'name email profileImage role')
      .populate('blog', 'title slug status')
      .sort({ createdAt: -1 })

    if (search) {
      const term = String(search).toLowerCase()
      comments = comments.filter(comment =>
        comment.content.toLowerCase().includes(term) ||
        comment.author?.name?.toLowerCase().includes(term) ||
        comment.author?.email?.toLowerCase().includes(term) ||
        comment.blog?.title?.toLowerCase().includes(term)
      )
    }

    res.json({ success: true, data: comments })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// PATCH /api/v1/blogs/admin/comments/:id — admin/blog-team: approve or reject
export const updateBlogCommentStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid comment status' } })
    }

    const comment = await BlogComment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, error: { message: 'Comment not found' } })

    comment.status = status
    comment.moderatedBy = req.user.id
    comment.moderatedAt = new Date()
    await comment.save()
    await comment.populate('author', 'name email profileImage role')
    await comment.populate('blog', 'title slug status')

    res.json({ success: true, message: `Comment ${status}`, data: comment })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// DELETE /api/v1/blogs/admin/comments/:id — admin/blog-team: soft delete
export const deleteBlogComment = asyncHandler(async (req, res) => {
  try {
    const comment = await BlogComment.findById(req.params.id)
    if (!comment) return res.status(404).json({ success: false, error: { message: 'Comment not found' } })

    comment.isDeleted = true
    await comment.save()

    res.json({ success: true, message: 'Comment deleted successfully' })
  } catch (error) {
    res.status(400).json({ success: false, error: { message: error.message } })
  }
})

// POST /api/v1/blogs — admin/teacher
export const createBlog = asyncHandler(async (req, res) => {
  try {
    if (!req.body.slug && req.body.title) {
      req.body.slug = req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
    }
    const blog = await Blog.create({ ...req.body, author: req.user.id })
    if (blog.status === 'published') pingBlog(blog.slug)
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

    if (blog.status === 'published') pingBlog(blog.slug)
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
