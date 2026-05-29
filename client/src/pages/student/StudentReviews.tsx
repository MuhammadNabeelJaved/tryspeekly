import { useState, useEffect } from 'react'
import { reviewsService } from '@/services/reviews.service'
import MyReviewsSection from '@/components/MyReviewsSection'
import type { Review } from '@/types/api'
import toast from 'react-hot-toast'

export default function StudentReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reviewsService.getMyReviews()
      .then(res => setReviews(res.data))
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">My Reviews</h2>
        <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
          All platform and course reviews you have submitted
        </p>
      </div>

      <MyReviewsSection
        reviews={reviews}
        loading={loading}
        onReviewUpdated={updated =>
          setReviews(prev => prev.map(r => r._id === updated._id ? updated : r))
        }
        onReviewDeleted={id =>
          setReviews(prev => prev.filter(r => r._id !== id))
        }
      />
    </div>
  )
}
