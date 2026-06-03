import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Star, PencilSimple, X, SealCheck } from '@phosphor-icons/react'

import { useAuth } from '@/context/AuthContext'
import { reviewsService } from '@/services/reviews.service'
import ReviewModal from '@/components/ReviewModal'
import UserAvatar from '@/components/UserAvatar'
import type { Review } from '@/types/api'

const CONTENT_LIMIT = 200

function ReviewDetailModal({ review, onClose }: { review: Review; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-800 overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={18} weight="fill" className="text-violet-500" />
                ))}
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[11px] font-semibold border border-green-200 dark:border-green-800/50">
                <SealCheck size={13} weight="fill" />
                Verified
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic mb-6">
              "{review.content}"
            </p>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
              <UserAvatar
                src={review.author?.profileImage}
                name={review.author?.name}
                size="sm"
              />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                  {review.author?.name}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                  {review.author?.role}
                </p>
              </div>
              <p className="ml-auto text-xs text-gray-400 dark:text-neutral-500">
                {new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Reviews() {
  const { isAuthenticated } = useAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [existingReview, setExistingReview] = useState<Review | null>(null)
  const [viewingReview, setViewingReview] = useState<Review | null>(null)

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
  const validReviews = reviews.filter(r => r.author != null)
  // 4 copies: guarantees viewport coverage even with 2–3 reviews.
  // CSS animation translates by -25% (= 1 copy width out of 4), so the reset
  // point is visually identical to the start — truly seamless loop.
  const marqueeItems = [...validReviews, ...validReviews, ...validReviews, ...validReviews]

  return (
    <section className="py-16 lg:py-24 bg-white dark:bg-neutral-950 transition-colors duration-300">
      <style>{`
        @keyframes reviews-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-25%); }
        }
        .reviews-marquee-track {
          animation: reviews-marquee 40s linear infinite;
          will-change: transform;
        }
        .reviews-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

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
          <div className="reviews-marquee-track flex items-stretch gap-8 w-max">
            {marqueeItems.map((review, i) => {
              const isLong = review.content.length > CONTENT_LIMIT
              const displayContent = isLong
                ? review.content.slice(0, CONTENT_LIMIT) + '…'
                : review.content

              return (
                <div
                  key={`${review._id}-${i}`}
                  className="w-[350px] sm:w-[420px] p-8 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 flex flex-col shrink-0 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, si) => (
                        <Star key={si} size={18} weight="fill" className="text-violet-500" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[11px] font-semibold border border-green-200 dark:border-green-800/50">
                      <SealCheck size={13} weight="fill" />
                      Verified
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 flex-grow italic">
                    "{displayContent}"
                  </p>

                  {isLong && (
                    <button
                      onClick={() => setViewingReview(review)}
                      className="self-start text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline mb-5"
                    >
                      View full review
                    </button>
                  )}
                  {!isLong && <div className="mb-5" />}

                  <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-100 dark:border-neutral-800">
                    <UserAvatar
                      src={review.author?.profileImage}
                      name={review.author?.name}
                      size="sm"
                      className="grayscale hover:grayscale-0 transition-all duration-300"
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                        {review.author?.name}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-xs capitalize">
                        {review.author?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

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

      {viewingReview && (
        <ReviewDetailModal
          review={viewingReview}
          onClose={() => setViewingReview(null)}
        />
      )}
    </section>
  )
}
