import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, PencilSimple, X, ArrowsClockwise,
  ChatText, Sparkle,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { reviewsService } from '@/services/reviews.service'
import MyReviewsSection from '@/components/MyReviewsSection'
import UserAvatar from '@/components/UserAvatar'
import type { Review } from '@/types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating, interactive = false, value = 0, onChange }: {
  rating?: number
  interactive?: boolean
  value?: number
  onChange?: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || value) : rating ?? 0
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHovered(i)}
          onMouseLeave={() => interactive && setHovered(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default pointer-events-none'}
        >
          <Star
            size={interactive ? 22 : 14}
            weight={i <= display ? 'fill' : 'regular'}
            className={i <= display ? 'text-amber-400' : 'text-slate-300 dark:text-neutral-700'}
          />
        </button>
      ))}
    </div>
  )
}


// ─── Write/Edit Review Modal ──────────────────────────────────────────────────

function ReviewModal({
  existing,
  onClose,
  onSaved,
}: {
  existing: Review | null
  onClose: () => void
  onSaved: (r: Review) => void
}) {
  const [rating, setRating]   = useState(existing?.rating ?? 0)
  const [content, setContent] = useState(existing?.content ?? '')
  const [saving, setSaving]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a rating'); return }
    if (content.trim().length < 10) { toast.error('Review must be at least 10 characters'); return }
    setSaving(true)
    try {
      let review: Review
      if (existing) {
        const res = await reviewsService.updateReview(existing._id, { rating, content: content.trim() })
        review = res.data
        toast.success('Review updated — back in approval queue')
      } else {
        const res = await reviewsService.submitReview({ type: 'team', rating, content: content.trim() })
        review = res.data
        toast.success('Review submitted for approval')
      }
      onSaved(review)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Failed to save review'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {existing ? 'Edit Your Review' : 'Write Your Review'}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
              Your Rating
            </label>
            <Stars interactive value={rating} onChange={setRating} />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest block mb-2">
              Your Experience
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              maxLength={1000}
              placeholder="Share your experience working here — the culture, growth, team, and what you learned…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-neutral-600 outline-none focus:border-violet-500 transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-400 dark:text-neutral-600 mt-1 text-right">
              {content.length}/1000
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <ArrowsClockwise size={13} className="animate-spin" />}
              {saving ? 'Submitting…' : existing ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false)
  const LIMIT = 180
  const long = review.content.length > LIMIT

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <span className="text-[10px] text-slate-400 dark:text-neutral-600">
          {new Date(review.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <p className="text-sm text-slate-700 dark:text-neutral-300 leading-relaxed">
        {expanded || !long ? `"${review.content}"` : `"${review.content.slice(0, LIMIT)}…"`}
        {long && (
          <button onClick={() => setExpanded(v => !v)} className="ml-1 text-violet-600 dark:text-violet-400 text-xs font-bold hover:underline">
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </p>

      <div className="flex items-center gap-3 pt-2 border-t border-slate-50 dark:border-neutral-800">
        <UserAvatar src={review.author?.profileImage} name={review.author?.name} size="sm" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{review.author?.name}</p>
          <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
            {review.jobTitle || (review.author as { jobTitle?: string }).jobTitle || 'Team Member'}
          </p>
        </div>
        {review.featuredOnHome && (
          <span className="ml-auto text-[10px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
            <Sparkle size={9} weight="fill" />Featured
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamReviews() {
  const [reviews, setReviews]       = useState<Review[]>([])
  const [myReviews, setMyReviews]   = useState<Review[]>([])
  const [myReview, setMyReview]     = useState<Review | null>(null)
  const [loading, setLoading]       = useState(true)
  const [myLoading, setMyLoading]   = useState(true)
  const [showModal, setShowModal]   = useState(false)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    reviewsService.getTeamReviews({ page, limit: 12 })
      .then(res => { setReviews(res.data); setTotalPages(res.pagination?.totalPages ?? 1) })
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => {
    setMyLoading(true)
    reviewsService.getMyReviews()
      .then(res => {
        setMyReviews(res.data)
        const mine = res.data.find((r: Review) => r.type === 'team') ?? null
        setMyReview(mine)
      })
      .catch(() => {})
      .finally(() => setMyLoading(false))
  }, [])

  const handleSaved = (r: Review) => {
    setMyReview(r)
    setMyReviews(prev => {
      const exists = prev.some(x => x._id === r._id)
      return exists ? prev.map(x => x._id === r._id ? r : x) : [r, ...prev]
    })
    if (r.status === 'approved') {
      setReviews(prev => {
        const exists = prev.some(x => x._id === r._id)
        return exists ? prev.map(x => x._id === r._id ? r : x) : [r, ...prev]
      })
    }
  }

  const canWrite = !myReview || myReview.status === 'rejected'
  const canEdit  = myReview && myReview.status === 'pending'

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Team Experiences</h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
            Reviews from team members about working here
          </p>
        </div>
        {(canWrite || canEdit) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
          >
            <PencilSimple size={15} weight="fill" />
            {canEdit ? 'Edit My Review' : 'Write a Review'}
          </button>
        )}
      </div>

      {/* My reviews section with stats */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-600 uppercase tracking-widest mb-3">My Review</p>
        <MyReviewsSection
          reviews={myReviews.filter(r => r.type === 'team')}
          loading={myLoading}
          onReviewUpdated={r => {
            setMyReview(r)
            setMyReviews(prev => prev.map(x => x._id === r._id ? r : x))
          }}
          onReviewDeleted={id => {
            setMyReview(null)
            setMyReviews(prev => prev.filter(x => x._id !== id))
          }}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 dark:border-neutral-800" />

      {/* All team reviews */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
          <ArrowsClockwise size={24} className="animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
          <ChatText size={40} className="mb-3" />
          <p className="text-sm font-semibold">No reviews yet</p>
          <p className="text-xs mt-1">Be the first to share your experience!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.filter(r => r.author != null).map(r => <ReviewCard key={r._id} review={r} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                Prev
              </button>
              <span className="text-xs font-semibold text-slate-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 dark:text-neutral-400 bg-slate-100 dark:bg-neutral-800 disabled:opacity-40 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors">
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ReviewModal
            existing={canEdit ? myReview : null}
            onClose={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
