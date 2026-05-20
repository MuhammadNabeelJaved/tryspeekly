import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Star, PencilSimple } from '@phosphor-icons/react'

import { useAuth } from '@/context/AuthContext'
import { reviewsService } from '@/services/reviews.service'
import ReviewModal from '@/components/ReviewModal'
import UserAvatar from '@/components/UserAvatar'
import type { Review } from '@/types/api'

export default function Reviews() {
  const { isAuthenticated } = useAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)

  useEffect(() => {
    let cancelled = false
    reviewsService
      .getPublicReviews()
      .then((res) => {
        if (!cancelled) setReviews(res.data)
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  async function handleWriteReview() {
    if (!isAuthenticated) {
      toast.error('Please login to write a review')
      return
    }
    try {
      const res = await reviewsService.getMyReviews()
      const platformReview = res.data.find((r) => r.type === 'platform') ?? null
      setExistingReview(platformReview)
    } catch {
      setExistingReview(null)
    }
    setIsModalOpen(true)
  }

  function handleReviewSuccess(review: Review) {
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r._id === review._id)
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = review
        return next
      }
      return prev
    })
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[220px]">
          <div className="flex flex-col items-center gap-4 text-gray-400 dark:text-neutral-500">
            <svg
              className="animate-spin h-8 w-8 text-violet-500"
              viewBox="0 0 24 24"
              fill="none"
            >
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
            <p className="text-sm font-medium">Loading reviews…</p>
          </div>
        </div>
      </section>
    )
  }

  // ─── Empty state ──────────────────────────────────────────────────────────────
  if (reviews.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
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

          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
            <Star size={40} className="mb-4 text-violet-200 dark:text-violet-900" />
            <p className="text-base font-medium">No featured reviews yet</p>
            <p className="text-sm mt-1">Be the first to share your experience!</p>
          </div>

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
              onClick={handleWriteReview}
              className="flex items-center gap-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
            >
              <PencilSimple size={18} />
              Write a Review
            </motion.button>
          </motion.div>
        </div>

        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          type="platform"
          existingReview={existingReview}
          onSuccess={handleReviewSuccess}
        />
      </section>
    )
  }

  // ─── Main render (with reviews) ───────────────────────────────────────────────
  // Double the array so the marquee loops seamlessly
  const marqueeItems = [...reviews, ...reviews]

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

        <div className="relative overflow-hidden mb-16">
          {/* Infinite Scroll Container */}
          <motion.div
            className="flex gap-8 w-max"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              duration: 40,
              ease: 'linear',
              repeat: Infinity,
            }}
            whileHover={{ animationPlayState: 'paused' }}
          >
            {marqueeItems.map((review, i) => (
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
                  <UserAvatar
                    src={review.author.profileImage}
                    name={review.author.name}
                    size="sm"
                    className="grayscale hover:grayscale-0 transition-all duration-300"
                  />
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

          {/* Fade gradients for seamless look */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10 pointer-events-none" />
        </div>

        {/* Write a Review Button Area */}
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
            onClick={handleWriteReview}
            className="flex items-center gap-2 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:border-violet-500 dark:hover:border-violet-500 px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <PencilSimple size={18} />
            Write a Review
          </motion.button>
        </motion.div>

      </div>

      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type="platform"
        existingReview={existingReview}
        onSuccess={handleReviewSuccess}
      />
    </section>
  )
}
