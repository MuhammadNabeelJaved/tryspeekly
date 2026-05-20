import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X } from '@phosphor-icons/react'
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

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
                <UserAvatar
                  src={user?.profileImage}
                  name={user?.name}
                  size="md"
                />
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
                      className="p-1 -ml-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
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
                  {isSubmitting && (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
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
