import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Trash,
  Check,
  X,
  MagnifyingGlass,
  ChatText,
} from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import { reviewsService } from '@/services/reviews.service'
import type { Review } from '@/types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function excerpt(text: string, max = 80): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function authorInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ─── Class Constants ──────────────────────────────────────────────────────────

const FILTER_LABEL_CLS =
  'text-[10px] font-semibold text-slate-400 dark:text-neutral-500 ' +
  'uppercase tracking-wide px-1'

const SEARCH_INPUT_CLS =
  'w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 ' +
  'dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm ' +
  'text-slate-900 dark:text-white placeholder-slate-300 ' +
  'dark:placeholder-neutral-600 outline-none ' +
  'focus:border-violet-500 dark:focus:border-violet-500 transition-colors'

const TH_CLS =
  'text-left px-4 py-3 text-[10px] font-bold text-slate-400 ' +
  'dark:text-neutral-500 uppercase tracking-wide whitespace-nowrap'

const TD_EMPTY_CLS =
  'text-center py-12 text-slate-400 dark:text-neutral-600 text-sm'

const AUTHOR_AVATAR_CLS =
  'w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 ' +
  'flex items-center justify-center text-white text-[10px] font-bold ' +
  'flex-shrink-0'

const ACTION_APPROVE_CLS =
  'w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 ' +
  'hover:bg-emerald-100 dark:hover:bg-emerald-950/40 ' +
  'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 ' +
  'flex items-center justify-center transition-colors'

const ACTION_REJECT_CLS =
  'w-7 h-7 rounded-lg bg-slate-100 dark:bg-neutral-800 ' +
  'hover:bg-red-100 dark:hover:bg-red-950/40 ' +
  'text-slate-500 hover:text-red-600 dark:hover:text-red-400 ' +
  'flex items-center justify-center transition-colors'

const FEAT_BASE_CLS =
  'bg-slate-100 dark:bg-neutral-800 text-slate-500'

const FEAT_ON_CLS =
  'hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-500'

const FEAT_OFF_CLS =
  'hover:bg-emerald-100 dark:hover:bg-emerald-950/40 ' +
  'hover:text-emerald-600 dark:hover:text-emerald-400'

const FEAT_DISABLED_CLS =
  'bg-slate-50 dark:bg-neutral-800/50 ' +
  'text-slate-300 dark:text-neutral-700 cursor-not-allowed'

const PAGINATION_BTN_CLS =
  'px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 ' +
  'text-xs font-semibold text-slate-600 dark:text-neutral-400 ' +
  'hover:bg-slate-100 dark:hover:bg-neutral-700 ' +
  'disabled:opacity-40 disabled:cursor-not-allowed transition-colors'

const PAGINATION_PAGE_INACTIVE_CLS =
  'border border-slate-200 dark:border-neutral-700 ' +
  'text-slate-600 dark:text-neutral-400 ' +
  'hover:bg-slate-100 dark:hover:bg-neutral-700'

const REJECT_INPUT_CLS =
  'flex-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 ' +
  'bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-white ' +
  'placeholder-slate-300 dark:placeholder-neutral-600 ' +
  'outline-none focus:border-red-400 transition-colors'

const REJECT_CONFIRM_CLS =
  'flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 ' +
  'text-white rounded-lg text-xs font-bold transition-colors'

const REJECT_CANCEL_CLS =
  'flex items-center gap-1.5 px-3 py-1.5 ' +
  'bg-slate-200 dark:bg-neutral-700 ' +
  'hover:bg-slate-300 dark:hover:bg-neutral-600 ' +
  'text-slate-700 dark:text-neutral-200 ' +
  'rounded-lg text-xs font-semibold transition-colors'

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Review['status'] }) {
  const map: Record<Review['status'], string> = {
    pending: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  }
  return (
    <span
      className={
        `px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${map[status]}`
      }
    >
      {status}
    </span>
  )
}

function TypeBadge({ type }: { type: Review['type'] }) {
  const map: Record<Review['type'], string> = {
    platform: 'bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400',
    course: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
  }
  return (
    <span
      className={
        `px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${map[type]}`
      }
    >
      {type}
    </span>
  )
}

function RoleBadge({ role }: { role: 'student' | 'teacher' | 'admin' }) {
  const map: Record<string, string> = {
    student: 'bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400',
    teacher: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400',
    admin: 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400',
  }
  return (
    <span
      className={
        `px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ` +
        `${map[role] ?? map.admin}`
      }
    >
      {role}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          weight={i < rating ? 'fill' : 'regular'}
          className={
            i < rating
              ? 'text-amber-400'
              : 'text-slate-300 dark:text-neutral-700'
          }
        />
      ))}
    </div>
  )
}

// ─── Filter Tab Group ─────────────────────────────────────────────────────────

function TabGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { label: string; value: T }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 rounded-xl p-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === opt.value
              ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-neutral-400 ' +
                'hover:text-slate-700 dark:hover:text-neutral-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Reject Inline Row ────────────────────────────────────────────────────────

function RejectInlineRow({
  note,
  onNoteChange,
  onConfirm,
  onCancel,
}: {
  note: string
  onNoteChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <tr className="bg-red-50 dark:bg-red-950/20">
      <td colSpan={10} className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className={
              'text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap'
            }
          >
            Rejection note (optional):
          </span>
          <input
            value={note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="Reason for rejection…"
            autoFocus
            className={REJECT_INPUT_CLS}
          />
          <button onClick={onConfirm} className={REJECT_CONFIRM_CLS}>
            <Check size={13} weight="bold" /> Confirm Reject
          </button>
          <button onClick={onCancel} className={REJECT_CANCEL_CLS}>
            <X size={13} /> Cancel
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
] as const

const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Platform', value: 'platform' },
  { label: 'Course', value: 'course' },
] as const

const TABLE_HEADERS = [
  'Author', 'Role', 'Type', 'Course', 'Rating',
  'Excerpt', 'Status', 'Featured', 'Date', 'Actions',
]

const LIMIT = 20

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchReviews = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await reviewsService.getAdminReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        page,
        limit: LIMIT,
      })
      if (res.success) {
        setReviews(res.data)
        setTotal(res.pagination?.total ?? 0)
      }
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, typeFilter, page])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [statusFilter, typeFilter])

  // ─── Action Handlers ──────────────────────────────────────────────────────────

  async function handleApprove(id: string) {
    try {
      await reviewsService.updateReviewStatus(id, { status: 'approved' })
      toast.success('Review approved')
      fetchReviews()
    } catch {
      toast.error('Failed to approve review')
    }
  }

  async function handleReject(id: string, note: string) {
    try {
      await reviewsService.updateReviewStatus(id, {
        status: 'rejected',
        adminNote: note || undefined,
      })
      toast.success('Review rejected')
      setRejectingId(null)
      setRejectNote('')
      fetchReviews()
    } catch {
      toast.error('Failed to reject review')
    }
  }

  async function handleToggleFeatured(id: string) {
    try {
      await reviewsService.toggleFeatured(id)
      fetchReviews()
    } catch {
      toast.error('Failed to update featured status')
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this review permanently?')) return
    try {
      await reviewsService.adminDeleteReview(id)
      toast.success('Review deleted')
      fetchReviews()
    } catch {
      toast.error('Failed to delete review')
    }
  }

  // ─── Client-side search filter ────────────────────────────────────────────────

  const q = search.toLowerCase()
  const displayed = q
    ? reviews.filter(r =>
        r.author.name.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        (r.course?.title ?? '').toLowerCase().includes(q)
      )
    : reviews

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 max-w-full">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Reviews{' '}
            <span className="text-slate-400 dark:text-neutral-500 font-medium text-base">
              ({total})
            </span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-neutral-500 mt-0.5">
            Moderate platform and course reviews
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <p className={`${FILTER_LABEL_CLS}`}>Status</p>
            <TabGroup
              value={statusFilter as typeof STATUS_OPTIONS[number]['value']}
              options={STATUS_OPTIONS as unknown as { label: string; value: string }[]}
              onChange={setStatusFilter}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className={`${FILTER_LABEL_CLS}`}>Type</p>
            <TabGroup
              value={typeFilter as typeof TYPE_OPTIONS[number]['value']}
              options={TYPE_OPTIONS as unknown as { label: string; value: string }[]}
              onChange={setTypeFilter}
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 sm:max-w-xs sm:ml-auto">
          <p className={`${FILTER_LABEL_CLS} mb-1`}>Search</p>
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className={
                'absolute left-3.5 top-1/2 -translate-y-1/2 ' +
                'text-slate-400 dark:text-neutral-500'
              }
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Author name, content…"
              className={SEARCH_INPUT_CLS}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={
          'bg-white dark:bg-neutral-900 rounded-2xl ' +
          'border border-slate-100 dark:border-neutral-800 overflow-hidden'
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr
                className={
                  'border-b border-slate-100 dark:border-neutral-800 ' +
                  'bg-slate-50 dark:bg-neutral-800/50'
                }
              >
                {TABLE_HEADERS.map(h => (
                  <th key={h} className={TH_CLS}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-neutral-800">
              {isLoading && (
                <tr>
                  <td colSpan={10} className={TD_EMPTY_CLS}>
                    Loading reviews…
                  </td>
                </tr>
              )}
              {!isLoading && displayed.length === 0 && (
                <tr>
                  <td colSpan={10} className={TD_EMPTY_CLS}>
                    <ChatText size={32} className="mx-auto mb-2 opacity-30" />
                    No reviews found
                  </td>
                </tr>
              )}

              <AnimatePresence>
                {!isLoading && displayed.map(review => (
                  <>
                    <motion.tr
                      key={review._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={
                        'hover:bg-slate-50 dark:hover:bg-neutral-800/40 ' +
                        'transition-colors group'
                      }
                    >
                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={AUTHOR_AVATAR_CLS}>
                            {review.author.profileImage ? (
                              <img
                                src={review.author.profileImage}
                                alt={review.author.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              authorInitials(review.author.name)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-xs">
                              {review.author.name}
                            </p>
                            {review.author.email && (
                              <p
                                className={
                                  'text-[10px] text-slate-400 dark:text-neutral-600 ' +
                                  'truncate max-w-[120px]'
                                }
                              >
                                {review.author.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <RoleBadge role={review.author.role} />
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <TypeBadge type={review.type} />
                      </td>

                      {/* Course */}
                      <td
                        className={
                          'px-4 py-3 text-xs text-slate-600 dark:text-neutral-300 ' +
                          'whitespace-nowrap max-w-[140px]'
                        }
                      >
                        {review.type === 'course' && review.course ? (
                          <span
                            className="truncate block max-w-[140px]"
                            title={review.course.title}
                          >
                            {review.course.title}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-neutral-600">—</span>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="px-4 py-3">
                        <StarRating rating={review.rating} />
                      </td>

                      {/* Excerpt */}
                      <td
                        className={
                          'px-4 py-3 text-xs text-slate-500 dark:text-neutral-400 ' +
                          'max-w-[200px]'
                        }
                      >
                        <span title={review.content}>{excerpt(review.content)}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={review.status} />
                      </td>

                      {/* Featured */}
                      <td className="px-4 py-3">
                        <Star
                          size={16}
                          weight={review.featuredOnHome ? 'fill' : 'regular'}
                          className={
                            review.featuredOnHome
                              ? 'text-emerald-500'
                              : 'text-slate-300 dark:text-neutral-700'
                          }
                        />
                      </td>

                      {/* Date */}
                      <td
                        className={
                          'px-4 py-3 text-[10px] text-slate-400 dark:text-neutral-600 ' +
                          'whitespace-nowrap'
                        }
                      >
                        {formatDate(review.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div
                          className={
                            'flex items-center gap-1 opacity-0 ' +
                            'group-hover:opacity-100 transition-opacity'
                          }
                        >
                          {/* Approve */}
                          {review.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(review._id)}
                              className={ACTION_APPROVE_CLS}
                              title="Approve"
                            >
                              <Check size={13} weight="bold" />
                            </button>
                          )}

                          {/* Reject */}
                          {review.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setRejectingId(review._id)
                                setRejectNote('')
                              }}
                              className={ACTION_REJECT_CLS}
                              title="Reject"
                            >
                              <X size={13} weight="bold" />
                            </button>
                          )}

                          {/* Toggle Featured */}
                          <button
                            onClick={() =>
                              review.status === 'approved' &&
                              handleToggleFeatured(review._id)
                            }
                            disabled={review.status !== 'approved'}
                            className={
                              `w-7 h-7 rounded-lg flex items-center ` +
                              `justify-center transition-colors ${
                                review.status === 'approved'
                                  ? `${FEAT_BASE_CLS} ${
                                      review.featuredOnHome
                                        ? FEAT_ON_CLS
                                        : FEAT_OFF_CLS
                                    }`
                                  : FEAT_DISABLED_CLS
                              }`
                            }
                            title={
                              review.status === 'approved'
                                ? 'Toggle Featured'
                                : 'Approve first to feature'
                            }
                          >
                            <Star
                              size={13}
                              weight={review.featuredOnHome ? 'fill' : 'regular'}
                            />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(review._id)}
                            className={ACTION_REJECT_CLS}
                            title="Delete"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Inline reject note row */}
                    {rejectingId === review._id && (
                      <RejectInlineRow
                        key={`reject-${review._id}`}
                        note={rejectNote}
                        onNoteChange={setRejectNote}
                        onConfirm={() => handleReject(review._id, rejectNote)}
                        onCancel={() => {
                          setRejectingId(null)
                          setRejectNote('')
                        }}
                      />
                    )}
                  </>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={
              'flex items-center justify-between px-4 py-3 ' +
              'border-t border-slate-100 dark:border-neutral-800 ' +
              'bg-slate-50 dark:bg-neutral-800/30'
            }
          >
            <p className="text-xs text-slate-500 dark:text-neutral-500">
              Page {page} of {totalPages} &mdash; {total} reviews
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={PAGINATION_BTN_CLS}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = i + 1
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={
                      `w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        page === pg
                          ? 'bg-violet-600 text-white'
                          : PAGINATION_PAGE_INACTIVE_CLS
                      }`
                    }
                  >
                    {pg}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={PAGINATION_BTN_CLS}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
