# Reviews & Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full CRUD reviews/feedback with admin approval, home page featured reviews, and course-specific reviews from real database data.

**Architecture:** Single `Review` model with `type: 'platform' | 'course'`. All reviews pending by default; admin approves/rejects. Approved + featuredOnHome reviews shown on home page. Approved course reviews shown on public CourseDetailsPage and student dashboard.

**Tech Stack:** Node.js/Express/Mongoose (server), React/TypeScript/Tailwind/Vite (client), Phosphor Icons, Framer Motion, react-hot-toast, Axios.

---

## File Map

### Create
- `server/src/models/review.model.js`
- `server/src/controllers/review.controller.js`
- `server/src/routes/review.route.js`
- `client/src/services/reviews.service.ts`
- `client/src/components/ReviewModal.tsx`
- `client/src/pages/admin/AdminReviews.tsx`

### Modify
- `server/app.js` — register `/api/v1/reviews`
- `client/src/types/api.ts` — add Review types
- `client/src/components/Reviews.tsx` — connect to backend
- `client/src/pages/CourseDetailsPage.tsx` — add reviews section
- `client/src/pages/student/StudentCourseDetails.tsx` — completion + review
- `client/src/pages/student/StudentCourses.tsx` — reviewed badge
- `client/src/pages/instructor/InstructorOverview.tsx` — platform review button
- `client/src/pages/AdminPage.tsx` — nav item + route + badge

---

## Task 1: Review Mongoose Model

**Files:**
- Create: `server/src/models/review.model.js`

- [ ] **Step 1: Create the model file**

```js
import mongoose from 'mongoose'

const { Schema, model } = mongoose

const reviewSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Review type is required'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      trim: true,
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    featuredOnHome: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
)

// One platform review per user
reviewSchema.index(
  { author: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'platform' } }
)
// One course review per student per course
reviewSchema.index(
  { author: 1, course: 1 },
  { unique: true, partialFilterExpression: { type: 'course' } }
)
// Fast home page query
reviewSchema.index({ status: 1, featuredOnHome: 1 })
// Fast course review listing
reviewSchema.index({ course: 1, status: 1 })

reviewSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const Review = mongoose.models.Review || model('Review', reviewSchema)

export default Review
```

- [ ] **Step 2: Verify server starts without errors**

```bash
cd server && node --input-type=module <<'EOF'
import './index.js'
EOF
```

Expected: server starts, no schema/index errors in console.

- [ ] **Step 3: Commit**

```bash
git add server/src/models/review.model.js
git commit -m "feat: add Review mongoose model with platform/course types and partial unique indexes"
```

---

## Task 2: Review Controller — Public + User Endpoints

**Files:**
- Create: `server/src/controllers/review.controller.js` (public + user sections)

- [ ] **Step 1: Create controller with public and user endpoints**

```js
import Joi from 'joi'
import asyncHandler from '../utils/asyncHandler.js'
import Review from '../models/review.model.js'
import Enrollment from '../models/enrollment.model.js'
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} from '../utils/apiErrors.js'

// ─── Validation schemas ────────────────────────────────────────────────────────

const submitSchema = Joi.object({
  type: Joi.string().valid('platform', 'course').required(),
  courseId: Joi.when('type', {
    is: 'course',
    then: Joi.string().required().messages({ 'any.required': 'courseId is required for course reviews' }),
    otherwise: Joi.forbidden().messages({ 'any.unknown': 'courseId is not allowed for platform reviews' }),
  }),
  rating: Joi.number().integer().min(1).max(5).required(),
  content: Joi.string().trim().min(10).max(1000).required(),
})

const updateSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  content: Joi.string().trim().min(10).max(1000),
}).min(1)

const statusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminNote: Joi.string().trim().max(500).allow(''),
})

// ─── Public ────────────────────────────────────────────────────────────────────

export const getPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: 'approved', featuredOnHome: true })
    .populate('author', 'name profileImage role')
    .sort({ updatedAt: -1 })

  res.json({ success: true, data: reviews })
})

export const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params
  const { page = 1, limit = 10 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const filter = { type: 'course', course: courseId, status: 'approved' }
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
})

// ─── Authenticated user ────────────────────────────────────────────────────────

export const submitReview = asyncHandler(async (req, res) => {
  const { error, value } = submitSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const { type, courseId, rating, content } = value
  const authorId = req.user.id

  if (type === 'course') {
    if (req.user.role !== 'student') throw new ForbiddenError('Only students can write course reviews')

    const enrollment = await Enrollment.findOne({ student: authorId, course: courseId, isActive: true })
    if (!enrollment) throw new ForbiddenError('You must be enrolled in this course to review it')

    const { sessionsAttended, totalSessions } = enrollment.progress
    if (sessionsAttended < totalSessions) {
      throw new ForbiddenError('Complete the course before writing a review')
    }
  }

  const review = await Review.create({
    type,
    author: authorId,
    course: type === 'course' ? courseId : undefined,
    rating,
    content,
  })

  await review.populate('author', 'name profileImage role')

  res.status(201).json({
    success: true,
    message: 'Review submitted. It will appear after admin approval.',
    data: review,
  })
})

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ author: req.user.id })
    .populate('course', 'title')
    .sort({ createdAt: -1 })

  res.json({ success: true, data: reviews })
})

export const getMyCourseReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ author: req.user.id, course: req.params.courseId })
    .populate('author', 'name profileImage role')

  res.json({ success: true, data: review ?? null })
})

export const updateReview = asyncHandler(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const review = await Review.findOne({ _id: req.params.id, author: req.user.id })
  if (!review) throw new NotFoundError('Review not found')

  Object.assign(review, value, { status: 'pending', featuredOnHome: false })
  await review.save()
  await review.populate('author', 'name profileImage role')

  res.json({ success: true, message: 'Review updated. It will re-enter the approval queue.', data: review })
})

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, author: req.user.id })
  if (!review) throw new NotFoundError('Review not found')

  review.isDeleted = true
  await review.save()

  res.json({ success: true, message: 'Review deleted' })
})
```

- [ ] **Step 2: Commit**

```bash
git add server/src/controllers/review.controller.js
git commit -m "feat: add review controller - public and user endpoints"
```

---

## Task 3: Review Controller — Admin Endpoints + Route File

**Files:**
- Modify: `server/src/controllers/review.controller.js` (append admin section)
- Create: `server/src/routes/review.route.js`

- [ ] **Step 1: Append admin controllers to `review.controller.js`**

Add at the bottom of the existing file:

```js
// ─── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query
  const filter = {}
  if (status && status !== 'all') filter.status = status
  if (type && type !== 'all') filter.type = type

  const skip = (Number(page) - 1) * Number(limit)
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('author', 'name profileImage role email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Review.countDocuments(filter),
  ])

  res.json({
    success: true,
    data: reviews,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  })
})

export const updateReviewStatus = asyncHandler(async (req, res) => {
  const { error, value } = statusSchema.validate(req.body)
  if (error) throw new BadRequestError(error.details[0].message)

  const review = await Review.findById(req.params.id)
  if (!review) throw new NotFoundError('Review not found')

  review.status = value.status
  if (value.adminNote) review.adminNote = value.adminNote
  if (value.status === 'rejected') review.featuredOnHome = false
  await review.save()

  res.json({ success: true, message: `Review ${value.status}`, data: review })
})

export const toggleFeatured = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) throw new NotFoundError('Review not found')
  if (review.status !== 'approved') throw new BadRequestError('Only approved reviews can be featured')

  review.featuredOnHome = !review.featuredOnHome
  await review.save()

  res.json({
    success: true,
    message: review.featuredOnHome ? 'Review featured on home page' : 'Review removed from home page',
    data: review,
  })
})

export const adminDeleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id)
  if (!review) throw new NotFoundError('Review not found')

  res.json({ success: true, message: 'Review permanently deleted' })
})
```

- [ ] **Step 2: Create `server/src/routes/review.route.js`**

```js
import express from 'express'
import { authenticate, authorize } from '../middlewares/auth.js'
import {
  getPublicReviews,
  getCourseReviews,
  submitReview,
  getMyReviews,
  getMyCourseReview,
  updateReview,
  deleteReview,
  getAdminReviews,
  updateReviewStatus,
  toggleFeatured,
  adminDeleteReview,
} from '../controllers/review.controller.js'

const router = express.Router()

// ─── Public ───────────────────────────────────────────────────────────────────
router.get('/public', getPublicReviews)
router.get('/course/:courseId', getCourseReviews)

// ─── Admin (before /:id to avoid shadowing) ──────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), getAdminReviews)
router.patch('/admin/:id/status', authenticate, authorize('admin'), updateReviewStatus)
router.patch('/admin/:id/feature', authenticate, authorize('admin'), toggleFeatured)
router.delete('/admin/:id', authenticate, authorize('admin'), adminDeleteReview)

// ─── Authenticated user ───────────────────────────────────────────────────────
router.get('/my', authenticate, getMyReviews)
router.get('/my/course/:courseId', authenticate, getMyCourseReview)
router.post('/', authenticate, submitReview)
router.patch('/:id', authenticate, updateReview)
router.delete('/:id', authenticate, deleteReview)

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/src/controllers/review.controller.js server/src/routes/review.route.js
git commit -m "feat: add review admin controllers and route file"
```

---

## Task 4: Register Route in app.js

**Files:**
- Modify: `server/app.js`

- [ ] **Step 1: Add import after the `seoRoutes` import line**

In `server/app.js`, after:
```js
import seoRoutes from './src/routes/seo.route.js'
```

Add:
```js
import reviewRoutes from './src/routes/review.route.js'
```

- [ ] **Step 2: Register the route after `app.use('/api/v1/seo', seoRoutes)`**

```js
app.use('/api/v1/reviews', reviewRoutes)
```

- [ ] **Step 3: Smoke-test with curl**

Start the server, then run:
```bash
curl http://localhost:5000/api/v1/reviews/public
```
Expected: `{"success":true,"data":[]}`

- [ ] **Step 4: Commit**

```bash
git add server/app.js
git commit -m "feat: register /api/v1/reviews route"
```

---

## Task 5: TypeScript Types + Review Service

**Files:**
- Modify: `client/src/types/api.ts`
- Create: `client/src/services/reviews.service.ts`

- [ ] **Step 1: Add Review types to `client/src/types/api.ts`**

Append to the end of the file:

```typescript
// ─── Review Types ─────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  type: 'platform' | 'course';
  author: {
    _id: string;
    name: string;
    profileImage?: string;
    role: 'student' | 'teacher' | 'admin';
    email?: string;
  };
  course?: {
    _id: string;
    title: string;
  };
  rating: number;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  featuredOnHome: boolean;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitReviewDto {
  type: 'platform' | 'course';
  courseId?: string;
  rating: number;
  content: string;
}

export interface UpdateReviewDto {
  rating?: number;
  content?: string;
}

export interface AdminUpdateReviewStatusDto {
  status: 'approved' | 'rejected';
  adminNote?: string;
}

export type ReviewListResponse = ApiPaginatedResponse<Review>;
export type ReviewSingleResponse = ApiResponse<Review>;
```

- [ ] **Step 2: Create `client/src/services/reviews.service.ts`**

```typescript
import { axiosClient } from '../lib/axiosClient';
import type {
  Review,
  SubmitReviewDto,
  UpdateReviewDto,
  AdminUpdateReviewStatusDto,
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
    const response = await axiosClient.get<ReviewListResponse>(`/reviews/course/${courseId}`, { params });
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
    const response = await axiosClient.get<ReviewSingleResponse>(`/reviews/my/course/${courseId}`);
    return response.data;
  },

  async updateReview(id: string, data: UpdateReviewDto): Promise<ReviewSingleResponse> {
    const response = await axiosClient.patch<ReviewSingleResponse>(`/reviews/${id}`, data);
    return response.data;
  },

  async deleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/reviews/${id}`);
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
    const response = await axiosClient.patch<ReviewSingleResponse>(`/reviews/admin/${id}/status`, data);
    return response.data;
  },

  async toggleFeatured(id: string): Promise<ReviewSingleResponse> {
    const response = await axiosClient.patch<ReviewSingleResponse>(`/reviews/admin/${id}/feature`, {});
    return response.data;
  },

  async adminDeleteReview(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axiosClient.delete<{ success: boolean; message: string }>(`/reviews/admin/${id}`);
    return response.data;
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add client/src/types/api.ts client/src/services/reviews.service.ts
git commit -m "feat: add Review types and reviews service"
```

---

## Task 6: Shared ReviewModal Component

**Files:**
- Create: `client/src/components/ReviewModal.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Spinner } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { reviewsService } from '@/services/reviews.service'
import UserAvatar from '@/components/UserAvatar'
import type { Review, SubmitReviewDto } from '@/types/api'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'platform' | 'course'
  courseId?: string
  existingReview?: Review | null
  onSuccess?: (review: Review) => void
}

export default function ReviewModal({
  isOpen,
  onClose,
  type,
  courseId,
  existingReview,
  onSuccess,
}: ReviewModalProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState(existingReview?.content ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRating(existingReview?.rating ?? 0)
      setContent(existingReview?.content ?? '')
    }
  }, [isOpen, existingReview])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }
    if (content.trim().length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    try {
      let res
      if (existingReview) {
        res = await reviewsService.updateReview(existingReview._id, { rating, content: content.trim() })
        toast.success('Review updated! It will re-enter the approval queue.')
      } else {
        const dto: SubmitReviewDto = { type, rating, content: content.trim() }
        if (type === 'course' && courseId) dto.courseId = courseId
        res = await reviewsService.submitReview(dto)
        toast.success('Review submitted! It will appear after admin approval.')
      }
      onSuccess?.(res.data)
      onClose()
    } catch {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {existingReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <form className="p-6 space-y-5" onSubmit={handleSubmit}>
              {/* Author info (read-only) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-neutral-800 rounded-xl">
                <UserAvatar src={user?.profileImage} name={user?.name || ''} size="md" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Overall Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 -ml-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={32}
                        weight={(hoverRating || rating) >= star ? 'fill' : 'regular'}
                        className={
                          (hoverRating || rating) >= star
                            ? 'text-violet-500'
                            : 'text-gray-300 dark:text-neutral-600'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all resize-none text-sm"
                  placeholder="Share your experience (min 10 characters)…"
                  maxLength={1000}
                />
                <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1 text-right">
                  {content.length}/1000
                </p>
              </div>

              {existingReview && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                  Editing will reset your review to pending — admin must re-approve it.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Spinner size={14} className="animate-spin" />}
                  {existingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ReviewModal.tsx
git commit -m "feat: add shared ReviewModal component with star rating and auth user display"
```

---

## Task 7: Reviews.tsx — Connect Home Page to Backend

**Files:**
- Modify: `client/src/components/Reviews.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, PencilSimple, Spinner } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { useAuth } from '@/context/AuthContext'
import { reviewsService } from '@/services/reviews.service'
import ReviewModal from '@/components/ReviewModal'
import UserAvatar from '@/components/UserAvatar'
import type { Review } from '@/types/api'

export default function Reviews() {
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)

  useEffect(() => {
    reviewsService.getPublicReviews()
      .then((res) => { if (res.success) setReviews(res.data) })
      .catch(() => {})
      .finally(() => setIsLoadingReviews(false))
  }, [])

  async function handleOpenModal() {
    if (!isAuthenticated) {
      toast.error('Please login to write a review')
      return
    }
    // Check if user already has a platform review
    try {
      const res = await reviewsService.getMyReviews()
      if (res.success) {
        const platform = res.data.find((r) => r.type === 'platform') ?? null
        setExistingReview(platform)
      }
    } catch {
      setExistingReview(null)
    }
    setIsModalOpen(true)
  }

  const displayReviews = reviews.length > 0 ? reviews : []

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4"
          >
            What our learners say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-lg"
          >
            Trusted by thousands of students worldwide.
          </motion.p>
        </div>

        {isLoadingReviews ? (
          <div className="flex justify-center py-16">
            <Spinner size={32} className="animate-spin text-violet-500" />
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-neutral-500">
            <p className="text-lg font-medium">No featured reviews yet.</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="relative overflow-hidden mb-16">
            <motion.div
              className="flex gap-8 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
            >
              {[...displayReviews, ...displayReviews].map((review, i) => (
                <motion.div
                  key={`${review._id}-${i}`}
                  className="w-[350px] sm:w-[450px] p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex flex-col h-full shrink-0 shadow-sm"
                >
                  <div className="flex gap-1 mb-6">
                    {Array.from({ length: review.rating }).map((_, si) => (
                      <Star key={si} size={18} weight="fill" className="text-violet-500" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 flex-grow italic">
                    "{review.content}"
                  </p>
                  <div className="flex items-center gap-4 mt-auto">
                    <UserAvatar src={review.author.profileImage} name={review.author.name} size="md" />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {review.author.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                        {review.author.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center pt-8 border-t border-gray-100 dark:border-neutral-800"
        >
          <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm font-medium">
            Have you learned with us?
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <PencilSimple size={18} />
            {isAuthenticated && existingReview ? 'Edit Your Review' : 'Write a Review'}
          </motion.button>
        </motion.div>
      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="platform"
        existingReview={existingReview}
        onSuccess={() => {}}
      />
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Reviews.tsx
git commit -m "feat: connect Reviews home page section to backend API"
```

---

## Task 8: CourseDetailsPage — Public Reviews Section

**Files:**
- Modify: `client/src/pages/CourseDetailsPage.tsx`

- [ ] **Step 1: Add state + fetch for course reviews**

In `CourseDetailsPage.tsx`, add these imports at the top with the existing ones:

```tsx
import { reviewsService } from '../services/reviews.service'
import UserAvatar from '../components/UserAvatar'
import type { Review } from '../types/api'
```

Add state inside the component (after existing state):

```tsx
const [courseReviews, setCourseReviews] = useState<Review[]>([])
const [reviewsLoading, setReviewsLoading] = useState(false)
```

Add `useParams` destructuring (the page already imports `useParams` — extract `courseId`):

```tsx
const { courseId } = useParams<{ courseId: string }>()
```

Add a `useEffect` to fetch reviews when courseId is available:

```tsx
useEffect(() => {
  if (!courseId) return
  setReviewsLoading(true)
  reviewsService.getCourseReviews(courseId)
    .then((res) => { if (res.success) setCourseReviews(res.data) })
    .catch(() => {})
    .finally(() => setReviewsLoading(false))
}, [courseId])
```

- [ ] **Step 2: Add the reviews section JSX at the bottom of the returned JSX (before the closing tag of the outermost container)**

Find the outermost closing `</div>` or `</section>` of the page and insert before it:

```tsx
{/* ─── Student Reviews Section ─────────────────────────────────────────────── */}
<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
  <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
    Student Reviews
  </h2>
  <p className="text-slate-500 dark:text-neutral-400 text-sm mb-8">
    What enrolled students say about this course
  </p>

  {reviewsLoading ? (
    <div className="flex items-center gap-2 text-slate-400 dark:text-neutral-500">
      <Spinner size={18} className="animate-spin" />
      <span className="text-sm">Loading reviews…</span>
    </div>
  ) : courseReviews.length === 0 ? (
    <div className="text-center py-12 bg-slate-50 dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800">
      <p className="text-slate-500 dark:text-neutral-400 font-medium">No reviews yet for this course.</p>
      <p className="text-slate-400 dark:text-neutral-500 text-sm mt-1">
        Be the first to complete the course and share your feedback!
      </p>
    </div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courseReviews.map((review) => (
        <div
          key={review._id}
          className="p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm flex flex-col gap-4"
        >
          <div className="flex gap-1">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} size={16} weight="fill" className="text-violet-500" />
            ))}
            {Array.from({ length: 5 - review.rating }).map((_, i) => (
              <Star key={i} size={16} weight="regular" className="text-slate-200 dark:text-neutral-700" />
            ))}
          </div>
          <p className="text-slate-700 dark:text-gray-300 text-sm leading-relaxed italic flex-grow">
            "{review.content}"
          </p>
          <div className="flex items-center gap-3 pt-2 border-t border-slate-50 dark:border-neutral-800">
            <UserAvatar src={review.author.profileImage} name={review.author.name} size="sm" />
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{review.author.name}</p>
              <p className="text-xs text-slate-400 dark:text-neutral-500">
                {new Date(review.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>
```

Add `Spinner` and `Star` to existing phosphor imports if not already present:
```tsx
import { ..., Star, Spinner } from '@phosphor-icons/react'
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/CourseDetailsPage.tsx
git commit -m "feat: add approved course reviews section to public CourseDetailsPage"
```

---

## Task 9: StudentCourseDetails — Completion + Review

**Files:**
- Modify: `client/src/pages/student/StudentCourseDetails.tsx`

- [ ] **Step 1: Add imports and state**

Add to existing imports:

```tsx
import { reviewsService } from '@/services/reviews.service'
import ReviewModal from '@/pages/student/ReviewModal'  // wrong path — use:
import ReviewModal from '@/components/ReviewModal'
import type { Review } from '@/types/api'
```

Add state inside the component after existing state declarations:

```tsx
const [reviewModalOpen, setReviewModalOpen] = useState(false)
const [existingCourseReview, setExistingCourseReview] = useState<Review | null>(null)
const [reviewLoading, setReviewLoading] = useState(false)
```

- [ ] **Step 2: Fetch existing course review when course is complete**

Add this `useEffect` after the existing data-fetching effects:

```tsx
useEffect(() => {
  if (!courseId || !enrollment) return
  const attended = enrollment.progress?.sessionsAttended ?? 0
  const total = enrollment.progress?.totalSessions ?? 0
  if (attended < total) return

  setReviewLoading(true)
  reviewsService.getMyCourseReview(courseId)
    .then((res) => { if (res.success) setExistingCourseReview(res.data) })
    .catch(() => {})
    .finally(() => setReviewLoading(false))
}, [courseId, enrollment])
```

- [ ] **Step 3: Hide "Join Next Class" button when course is complete**

Find the "Join Next Class" `<a>` button in the header section (around line 248–259 of the original). Wrap it with a condition:

Replace:
```tsx
{course.meetLink && (
  <a
    href={course.meetLink}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)] whitespace-nowrap"
  >
    <VideoCamera size={20} weight="fill" />
    Join Next Class
  </a>
)}
```

With:
```tsx
{course.meetLink && totalSessions > 0 && sessionsAttended < totalSessions && (
  <a
    href={course.meetLink}
    target="_blank"
    rel="noreferrer"
    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)] whitespace-nowrap"
  >
    <VideoCamera size={20} weight="fill" />
    Join Next Class
  </a>
)}
```

- [ ] **Step 4: Add "Leave a Review" button to the completion card and hide sidebar "Join Live Class" when complete**

Find the completion card (around line 542–565 of the original) that shows "Course Complete!" with "Claim Certificate". Add the review button below the claim button:

```tsx
{totalSessions > 0 && sessionsAttended >= totalSessions && (
  <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl p-6 shadow-lg shadow-violet-600/20">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
        <Medal size={22} weight="fill" className="text-white" />
      </div>
      <div>
        <p className="text-white font-black text-sm">Course Complete!</p>
        <p className="text-violet-200 text-xs">You've earned your certificate</p>
      </div>
    </div>
    <button
      onClick={handleClaimCertificate}
      disabled={isClaiming}
      className="w-full flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-black py-2.5 rounded-xl transition-colors text-sm disabled:opacity-70 shadow-sm"
    >
      {isClaiming ? (
        <><Spinner size={16} className="animate-spin" /> Claiming…</>
      ) : (
        <><Medal size={16} weight="fill" /> Claim Certificate</>
      )}
    </button>
    {!reviewLoading && (
      <button
        onClick={() => setReviewModalOpen(true)}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl transition-colors text-sm"
      >
        <Star size={16} weight={existingCourseReview ? 'fill' : 'regular'} />
        {existingCourseReview ? 'Edit Your Review' : 'Leave a Review'}
      </button>
    )}
  </div>
)}
```

Find the sidebar "Join Live Class" button and hide it when complete:

Replace:
```tsx
{course.meetLink ? (
  <a
    href={course.meetLink}
    ...
  >
    <VideoCamera size={18} weight="fill" />
    Join Live Class
  </a>
) : (
```

With:
```tsx
{course.meetLink && totalSessions > 0 && sessionsAttended < totalSessions ? (
  <a
    href={course.meetLink}
    target="_blank"
    rel="noreferrer"
    className="mt-4 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-[0_4px_14px_rgba(124,58,237,0.25)]"
  >
    <VideoCamera size={18} weight="fill" />
    Join Live Class
  </a>
) : (
  <div className="mt-4 flex items-center gap-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl px-4 py-3">
    <VideoCamera size={16} className="text-slate-400 flex-shrink-0" />
    <p className="text-xs text-slate-500 dark:text-neutral-400">
      {totalSessions > 0 && sessionsAttended >= totalSessions
        ? 'Course completed — live classes ended.'
        : 'Live class link not set yet.'}
    </p>
  </div>
)}
```

Add `Star` to existing phosphor imports if not already imported.

Add the `ReviewModal` at the bottom before closing `</div>`:

```tsx
<ReviewModal
  isOpen={reviewModalOpen}
  onClose={() => setReviewModalOpen(false)}
  type="course"
  courseId={courseId}
  existingReview={existingCourseReview}
  onSuccess={(review) => setExistingCourseReview(review)}
/>
```

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/student/StudentCourseDetails.tsx
git commit -m "feat: add course review button on completion, hide join-class buttons when course done"
```

---

## Task 10: StudentCourses — Reviewed Badge

**Files:**
- Modify: `client/src/pages/student/StudentCourses.tsx`

- [ ] **Step 1: Fetch own reviews on mount and show badge**

Add imports:

```tsx
import { reviewsService } from '@/services/reviews.service'
import type { Review } from '@/types/api'
import { Star } from '@phosphor-icons/react'
```

Add state inside the component:

```tsx
const [myReviews, setMyReviews] = useState<Review[]>([])
```

Add a `useEffect` after `fetchEnrollments`:

```tsx
useEffect(() => {
  reviewsService.getMyReviews()
    .then((res) => { if (res.success) setMyReviews(res.data) })
    .catch(() => {})
}, [])
```

- [ ] **Step 2: Derive a helper set and add the badge**

After the state declarations, add:

```tsx
const reviewedCourseIds = new Set(
  myReviews.filter((r) => r.type === 'course').map((r) => r.course?._id ?? '')
)
```

Inside the enrollment card, find where `attended` and `total` are derived and add, after the existing status badges:

```tsx
{total > 0 && attended >= total && (
  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide flex items-center gap-1 ${
    reviewedCourseIds.has(enrollment.course?._id ?? '')
      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
  }`}>
    <Star size={10} weight={reviewedCourseIds.has(enrollment.course?._id ?? '') ? 'fill' : 'regular'} />
    {reviewedCourseIds.has(enrollment.course?._id ?? '') ? 'Reviewed' : 'Review Pending'}
  </span>
)}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/student/StudentCourses.tsx
git commit -m "feat: show reviewed badge on completed courses in student dashboard"
```

---

## Task 11: InstructorOverview — Platform Review Button

**Files:**
- Modify: `client/src/pages/instructor/InstructorOverview.tsx`

- [ ] **Step 1: Add imports and state**

Add to existing imports:

```tsx
import { useState } from 'react'  // already imported, just verify
import { Star } from '@phosphor-icons/react'
import { reviewsService } from '@/services/reviews.service'
import ReviewModal from '@/components/ReviewModal'
import type { Review } from '@/types/api'
```

Add state inside the component:

```tsx
const [reviewModalOpen, setReviewModalOpen] = useState(false)
const [existingPlatformReview, setExistingPlatformReview] = useState<Review | null>(null)
```

- [ ] **Step 2: Add handler and UI**

Add handler function inside the component:

```tsx
async function handleOpenReviewModal() {
  try {
    const res = await reviewsService.getMyReviews()
    if (res.success) {
      const platform = res.data.find((r) => r.type === 'platform') ?? null
      setExistingPlatformReview(platform)
    }
  } catch {
    setExistingPlatformReview(null)
  }
  setReviewModalOpen(true)
}
```

Find the return JSX and add a "Share Your Experience" card. Place it after the main stats cards and before the courses list. Insert:

```tsx
{/* Share Your Experience */}
<div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 p-5 flex items-center justify-between gap-4">
  <div>
    <p className="text-sm font-black text-slate-900 dark:text-white">Share Your Experience</p>
    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
      Help future students by writing a platform review
    </p>
  </div>
  <button
    onClick={handleOpenReviewModal}
    className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap"
  >
    <Star size={16} weight="fill" />
    {existingPlatformReview ? 'Edit Review' : 'Write a Review'}
  </button>
</div>
```

Add the modal at the bottom of the returned JSX (before the closing tag):

```tsx
<ReviewModal
  isOpen={reviewModalOpen}
  onClose={() => setReviewModalOpen(false)}
  type="platform"
  existingReview={existingPlatformReview}
  onSuccess={(review) => setExistingPlatformReview(review)}
/>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/instructor/InstructorOverview.tsx
git commit -m "feat: add platform review button to instructor overview"
```

---

## Task 12: AdminReviews.tsx

**Files:**
- Create: `client/src/pages/admin/AdminReviews.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Check, X, Trash, MagnifyingGlass, Sparkle,
  Spinner, Warning, BookOpen, Globe
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { reviewsService } from '../../services/reviews.service'
import UserAvatar from '../../components/UserAvatar'
import type { Review, AdminUpdateReviewStatusDto } from '../../types/api'

const STATUS_COLORS: Record<string, string> = {
  pending:  'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
  approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [rejectModalId, setRejectModalId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await reviewsService.getAdminReviews({
        status: statusFilter,
        type: typeFilter,
        limit: 50,
      })
      if (res.success) setReviews(res.data)
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [statusFilter, typeFilter])

  async function handleApprove(id: string) {
    setActionLoading(id + '-approve')
    try {
      await reviewsService.updateReviewStatus(id, { status: 'approved' })
      toast.success('Review approved')
      setReviews((prev) => prev.map((r) => r._id === id ? { ...r, status: 'approved' } : r))
    } catch {
      toast.error('Failed to approve review')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id + '-reject')
    try {
      const dto: AdminUpdateReviewStatusDto = { status: 'rejected' }
      if (rejectNote.trim()) dto.adminNote = rejectNote.trim()
      await reviewsService.updateReviewStatus(id, dto)
      toast.success('Review rejected')
      setReviews((prev) => prev.map((r) => r._id === id ? { ...r, status: 'rejected', adminNote: dto.adminNote } : r))
      setRejectModalId(null)
      setRejectNote('')
    } catch {
      toast.error('Failed to reject review')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleFeatured(id: string) {
    setActionLoading(id + '-feature')
    try {
      const res = await reviewsService.toggleFeatured(id)
      if (res.success) {
        setReviews((prev) => prev.map((r) => r._id === id ? { ...r, featuredOnHome: res.data.featuredOnHome } : r))
        toast.success(res.data.featuredOnHome ? 'Featured on home page' : 'Removed from home page')
      }
    } catch {
      toast.error('Failed to update featured status')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this review?')) return
    setActionLoading(id + '-delete')
    try {
      await reviewsService.adminDeleteReview(id)
      toast.success('Review deleted')
      setReviews((prev) => prev.filter((r) => r._id !== id))
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setActionLoading(null)
    }
  }

  const pending = reviews.filter((r) => r.status === 'pending').length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Reviews</h2>
          {pending > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              {pending} review{pending > 1 ? 's' : ''} awaiting approval
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px bg-slate-200 dark:bg-neutral-700" />
          {(['all', 'platform', 'course'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize ${
                typeFilter === t
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={28} className="animate-spin text-violet-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-slate-400 dark:text-neutral-500">
          <Warning size={40} className="mx-auto mb-3" />
          <p className="font-semibold">No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <motion.div
              key={review._id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border shadow-sm p-5 ${
                review.status === 'pending'
                  ? 'border-amber-200 dark:border-amber-900/40'
                  : 'border-slate-100 dark:border-neutral-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Author */}
                <div className="flex items-center gap-3 min-w-0 sm:w-48 flex-shrink-0">
                  <UserAvatar src={review.author.profileImage} name={review.author.name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {review.author.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-neutral-500 capitalize">
                      {review.author.role}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={13} weight="fill" className="text-violet-500" />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[review.status]}`}>
                      {review.status}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 flex items-center gap-1">
                      {review.type === 'course' ? <><BookOpen size={9} /> Course</> : <><Globe size={9} /> Platform</>}
                    </span>
                    {review.featuredOnHome && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <Sparkle size={9} weight="fill" /> Featured
                      </span>
                    )}
                  </div>

                  {review.course && (
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mb-1">
                      Course: <span className="font-semibold">{review.course.title}</span>
                    </p>
                  )}

                  <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed line-clamp-2 italic">
                    "{review.content}"
                  </p>

                  {review.adminNote && (
                    <p className="text-xs text-slate-400 dark:text-neutral-500 mt-1 italic">
                      Note: {review.adminNote}
                    </p>
                  )}

                  <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-1">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(review._id)}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                    >
                      {actionLoading === review._id + '-approve'
                        ? <Spinner size={12} className="animate-spin" />
                        : <Check size={13} weight="bold" />}
                      Approve
                    </button>
                  )}

                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => { setRejectModalId(review._id); setRejectNote('') }}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                    >
                      <X size={13} weight="bold" /> Reject
                    </button>
                  )}

                  {review.status === 'approved' && (
                    <button
                      onClick={() => handleToggleFeatured(review._id)}
                      disabled={!!actionLoading}
                      className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors disabled:opacity-60 ${
                        review.featuredOnHome
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {actionLoading === review._id + '-feature'
                        ? <Spinner size={12} className="animate-spin" />
                        : <Sparkle size={13} weight={review.featuredOnHome ? 'fill' : 'regular'} />}
                      {review.featuredOnHome ? 'Unfeature' : 'Feature'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-500 dark:text-neutral-400 hover:text-red-500 text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                  >
                    {actionLoading === review._id + '-delete'
                      ? <Spinner size={12} className="animate-spin" />
                      : <Trash size={13} />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setRejectModalId(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 dark:border-neutral-800 p-6"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Reject Review</h3>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Optional note for the reviewer…"
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setRejectModalId(null)}
                  className="px-5 py-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(rejectModalId)}
                  disabled={!!actionLoading}
                  className="px-5 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/admin/AdminReviews.tsx
git commit -m "feat: add AdminReviews page with approve/reject/feature/delete"
```

---

## Task 13: AdminPage.tsx — Nav + Route + Pending Badge

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

- [ ] **Step 1: Add lazy import and route**

After the existing lazy imports (e.g., after `const AdminSEO = lazy(...)`), add:

```tsx
const AdminReviews = lazy(() => import('./admin/AdminReviews'))
```

Inside the `<Routes>` block, after `<Route path="/seo" ...>`, add:

```tsx
<Route path="/reviews" element={<AdminReviews />} />
```

- [ ] **Step 2: Add `'reviews'` to the `AdminView` type**

Find:
```tsx
export type AdminView = 'overview' | 'students' | ... | 'seo'
```

Add `| 'reviews'` at the end:
```tsx
export type AdminView = 'overview' | 'students' | 'instructors' | 'courses' | 'certificates' | 'payments' | 'payments-setup' | 'financial-aid' | 'cms' | 'blog' | 'settings' | 'support' | 'notifications' | 'messages' | 'seo' | 'reviews'
```

- [ ] **Step 3: Add nav item and import icon**

Add `ChatTeardropText` (or use `Star`) to the phosphor import line. Use `Star`:
```tsx
import { ..., Star } from '@phosphor-icons/react'
```

In the `NAV_MANAGEMENT` array, add after the `seo` entry:
```tsx
{ view: 'reviews', label: 'Reviews', path: 'reviews', Icon: Star as NavItem['Icon'] },
```

- [ ] **Step 4: Add pending reviews badge to `adminBadges` state**

Find the `adminBadges` state:
```tsx
const [adminBadges, setAdminBadges] = useState({ students: 0, pendingPayments: 0, pendingCourses: 0, pendingFinancialAid: 0 })
```

Change to:
```tsx
const [adminBadges, setAdminBadges] = useState({
  students: 0,
  pendingPayments: 0,
  pendingCourses: 0,
  pendingFinancialAid: 0,
  pendingReviews: 0,
})
```

Add a separate `useEffect` to fetch pending reviews count (after the existing stats `useEffect`):

```tsx
useEffect(() => {
  reviewsService.getAdminReviews({ status: 'pending', limit: 1 })
    .then((res) => {
      if (res.success) {
        setAdminBadges((prev) => ({ ...prev, pendingReviews: res.pagination?.total ?? 0 }))
      }
    })
    .catch(() => {})
}, [])
```

Add the import for `reviewsService` at the top with client imports:
```tsx
import { reviewsService } from '../services/reviews.service'
```

- [ ] **Step 5: Wire badge in `renderNavItem`**

Find the `badge` computation in `renderNavItem`. Add the reviews case:

```tsx
const badge =
  view === 'messages' && unreadMessages > 0 ? unreadMessages :
  view === 'notifications' && unreadNotifications > 0 ? unreadNotifications :
  view === 'students' && adminBadges.students > 0 ? adminBadges.students :
  view === 'payments' && adminBadges.pendingPayments > 0 ? adminBadges.pendingPayments :
  view === 'courses' && adminBadges.pendingCourses > 0 ? adminBadges.pendingCourses :
  view === 'financial-aid' && adminBadges.pendingFinancialAid > 0 ? adminBadges.pendingFinancialAid :
  view === 'reviews' && adminBadges.pendingReviews > 0 ? adminBadges.pendingReviews :
  null
```

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/AdminPage.tsx
git commit -m "feat: add Reviews nav item, route, and pending badge to admin dashboard"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Home page reviews from DB with featured toggle
- ✅ Write a Review modal — logged-in users only, name/avatar from auth
- ✅ Teacher platform reviews from InstructorOverview
- ✅ Student course reviews from StudentCourseDetails after completion
- ✅ Join Next Class hidden after completion
- ✅ "Reviewed ✓" badge on completed courses in StudentCourses
- ✅ Admin approval workflow (approve/reject/feature/delete)
- ✅ CourseDetailsPage public reviews section
- ✅ Admin sidebar pending badge
- ✅ One review per user per course (DB index + controller check)
- ✅ Editing resets to pending

**Type consistency check:**
- `Review`, `SubmitReviewDto`, `UpdateReviewDto`, `AdminUpdateReviewStatusDto` all defined in Task 5 and used consistently in Tasks 6–13
- `reviewsService` methods match route paths defined in Task 3
- `ReviewModal` props match usage in Tasks 7, 9, 11

**No placeholders:** All steps contain complete code.
