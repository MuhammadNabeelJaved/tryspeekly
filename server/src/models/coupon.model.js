import mongoose from 'mongoose'

const { Schema, model } = mongoose

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ['admin', 'referral'],
      required: [true, 'Source is required'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value cannot be negative'],
    },
    scope: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Scope is required'],
    },
    course: { type: Schema.Types.ObjectId, ref: 'Course', default: null },
    maxUses: { type: Number, default: null, min: [1, 'Max uses must be at least 1'] },
    usedCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Creator is required'] },
    referrer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false }
)

couponSchema.index({ referrer: 1, course: 1 })
couponSchema.index({ source: 1, isActive: 1 })

const Coupon = mongoose.models.Coupon || model('Coupon', couponSchema)

export default Coupon
