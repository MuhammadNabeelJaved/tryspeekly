import { Types } from 'mongoose'

/**
 * Returns the effective price for a course given an array of active offer docs.
 * Priority: course-specific offer > platform-wide offer (highest discount wins per type).
 *
 * @param {string|Types.ObjectId} courseId
 * @param {number} originalPrice  — in PKR (course.price)
 * @param {Array}  offers         — array of Offer documents
 * @returns {{ discountedPrice: number, offer: object|null }}
 */
export function getEffectivePrice(courseId, originalPrice, offers) {
  if (!originalPrice || !offers || offers.length === 0) {
    return { discountedPrice: originalPrice, offer: null }
  }

  const now = new Date()
  const courseIdStr = courseId?.toString()

  const activeOffers = offers.filter(o => {
    if (!o.isActive) return false
    if (o.startsAt && o.startsAt > now) return false
    if (o.endsAt && o.endsAt < now) return false
    return true
  })

  // Separate course-specific and platform-wide
  const courseOffers = activeOffers.filter(
    o => o.scope === 'course' && o.course?.toString() === courseIdStr
  )
  const platformOffers = activeOffers.filter(o => o.scope === 'platform')

  // Pick best offer: course-specific first, else platform (highest discount)
  const candidates = courseOffers.length > 0 ? courseOffers : platformOffers
  if (candidates.length === 0) return { discountedPrice: originalPrice, offer: null }

  const best = candidates.reduce((prev, curr) => {
    const prevDiscount = prev.discountType === 'percentage'
      ? (originalPrice * prev.discountValue) / 100
      : prev.discountValue
    const currDiscount = curr.discountType === 'percentage'
      ? (originalPrice * curr.discountValue) / 100
      : curr.discountValue
    return currDiscount > prevDiscount ? curr : prev
  })

  let discountAmount = best.discountType === 'percentage'
    ? Math.round((originalPrice * best.discountValue) / 100)
    : Math.min(best.discountValue, originalPrice)

  const discountedPrice = Math.max(0, originalPrice - discountAmount)
  return { discountedPrice, offer: best }
}
