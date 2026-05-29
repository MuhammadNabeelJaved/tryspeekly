import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Clock, CheckCircle, XCircle, PencilSimple, Trash,
  ArrowsClockwise, ChatText, X, Warning,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { reviewsService } from '@/services/reviews.service'
import UserAvatar from '@/components/UserAvatar'
import type { Review } from '@/types/api'

// ─── Stars ────────────────────────────────────────────────────────────────────

function Stars({ rating, interactive = false, value = 0, onChange }: {
  rating?: number
  interactive?: boolean
  value?: number
  onChange?: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  const display = interactive ? (hovered || value) : (rating ?? 0)
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
            size={interactive ? 22 : 15}
            weight={i <= display ? 'fill' : 'regular'}
            className={i <= display ? 'text-amber-400' : 'text-slate-300 dark:text-neutral-700'}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Review['status'] }) {
  const map = {
    pending:  { label: 'Pending',  cls: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',     Icon: Clock },
    approved: { label: 'Approved', cls: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400', Icon: CheckCircle },
    rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',             Icon: XCircle },
  }
  const { label, cls, Icon } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      <Icon size={10} weight="fill" />{label}
    </span>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type, courseTitle }: { type: Review['type']; courseTitle?: string }) {
  const map: Record<Review['type'], string> = {
    platform: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
    course:   'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    team:     'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
  }
  const labels: Record<Review['type'], string> = {
    platform: 'Platform Review',
    course:   courseTitle ? `Course: ${courseTitle}` : 'Course Review',
    team:     'Team Experience',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold truncate max-w-[200px] ${map[type]}`}>
      {labels[type]}
    </span>
  )
}

// ─── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({ review, onClose, onSaved }: {
  review: Review
  onClose: () => void
  onSaved: (r: Review) => void
}) {
  const [rating, setRating]   = useState(review.rating)
  const [content, setContent] = useState(review.content)
  const [saving, setSaving]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { toast.error('Please select a rating'); return }
    if (content.trim().length < 10) { toast.error('Review must be at least 10 characters'); return }
    setSaving(true)
    try {
      const res = await reviewsService.updateReview(review._id, { rating, content: content.trim() })
      onSaved(res.data)
      toast.success('Review updated — back in approval queue')
      onClose()
    } catch {
      toast.error('Failed to update review')
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Edit Review</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Rating</p>
            <Stars interactive value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest mb-2">Review</p>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              maxLength={1000}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-sm text-slate-900 dark:text-white outline-none focus:border-violet-500 transition-colors resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{content.length}/1000</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <ArrowsClockwise size={13} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Delete confirm ───────────────────────────────────────────────────────────

function DeleteConfirm({ onClose, onConfirm, loading }: {
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
            <Warning size={20} weight="fill" className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Delete Review</h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">This will permanently remove your review. This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-neutral-700 text-sm font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <ArrowsClockwise size={13} className="animate-spin" />}
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

interface Props {
  reviews: Review[]
  loading: boolean
  onReviewUpdated: (r: Review) => void
  onReviewDeleted: (id: string) => void
}

export default function MyReviewsSection({ reviews, loading, onReviewUpdated, onReviewDeleted }: Props) {
  const [editingReview, setEditingReview]   = useState<Review | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading]   = useState(false)

  const total    = reviews.length
  const pending  = reviews.filter(r => r.status === 'pending').length
  const approved = reviews.filter(r => r.status === 'approved').length
  const rejected = reviews.filter(r => r.status === 'rejected').length

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleteLoading(true)
    try {
      await reviewsService.deleteReview(deletingId)
      onReviewDeleted(deletingId)
      toast.success('Review deleted')
      setDeletingId(null)
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
        <ArrowsClockwise size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total',    value: total,    color: 'text-slate-800 dark:text-white' },
          { label: 'Pending',  value: pending,  color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved', value: approved, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Rejected', value: rejected, color: 'text-red-500 dark:text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 text-center">
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-neutral-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-neutral-600">
          <ChatText size={40} className="mb-3" />
          <p className="text-sm font-semibold">No reviews yet</p>
          <p className="text-xs mt-1">Your submitted reviews will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div
              key={r._id}
              className={`bg-white dark:bg-neutral-900 rounded-2xl border p-5 transition-all ${
                r.status === 'rejected'
                  ? 'border-red-200 dark:border-red-900/50'
                  : r.status === 'pending'
                  ? 'border-amber-200 dark:border-amber-900/50'
                  : 'border-slate-200 dark:border-neutral-800'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <TypeBadge type={r.type} courseTitle={r.course?.title} />
                  <StatusBadge status={r.status} />
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {(r.status === 'pending') && (
                    <button
                      onClick={() => setEditingReview(r)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-violet-100 dark:hover:bg-violet-950/40 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 flex items-center justify-center transition-colors"
                      title="Edit review"
                    >
                      <PencilSimple size={13} weight="fill" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeletingId(r._id)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-950/30 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Delete review"
                  >
                    <Trash size={13} weight="fill" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <Stars rating={r.rating} />

              {/* Content */}
              <p className="text-sm text-slate-700 dark:text-neutral-300 leading-relaxed mt-2 italic">
                "{r.content}"
              </p>

              {/* Rejection reason */}
              {r.status === 'rejected' && r.adminNote && (
                <div className="mt-3 flex items-start gap-2 bg-red-50 dark:bg-red-950/20 rounded-xl px-3 py-2.5">
                  <XCircle size={14} weight="fill" className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-0.5">Rejection Reason</p>
                    <p className="text-xs text-red-700 dark:text-red-300">{r.adminNote}</p>
                  </div>
                </div>
              )}

              {r.status === 'rejected' && !r.adminNote && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400 italic">
                  Your review was not approved. No reason was provided.
                </p>
              )}

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-50 dark:border-neutral-800 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 dark:text-neutral-600">
                  Submitted {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {r.createdAt !== r.updatedAt && (
                    <span> · Updated {new Date(r.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                </p>
                {r.featuredOnHome && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">★ Featured on homepage</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editingReview && (
          <EditModal
            review={editingReview}
            onClose={() => setEditingReview(null)}
            onSaved={r => { onReviewUpdated(r); setEditingReview(null) }}
          />
        )}
        {deletingId && (
          <DeleteConfirm
            onClose={() => setDeletingId(null)}
            onConfirm={handleDelete}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
