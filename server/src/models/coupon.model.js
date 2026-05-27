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
      maxlength: [50, 'Coupon code cannot exceed 50 characters'],
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
      min: [0.01, 'Discount value must be greater than 0'],
    },
    scope: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Scope is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      validate: {
        validator: function (v) {
          return this.scope !== 'course' || v != null
        },
        message: 'course is required when scope is "course"',
      },
    },
    maxUses: { type: Number, default: null, min: [1, 'Max uses must be at least 1'] },
    usedCount: { type: Number, default: 0, min: [0, 'Used count cannot be negative'] },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'Creator is required'] },
    referrer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      validate: {
        validator: function (v) {
          return this.source !== 'referral' || v != null
        },
        message: 'referrer is required when source is "referral"',
      },
    },
  },
  { timestamps: true, versionKey: false }
)

// ─── Percentage Discount Upper Bound ──────────────────────────────────────────
couponSchema.pre('validate', function () {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    this.invalidate('discountValue', 'Percentage discount cannot exceed 100')
  }
})

couponSchema.index({ source: 1, referrer: 1, course: 1 })
couponSchema.index({ source: 1, isActive: 1 })

const Coupon = mongoose.models.Coupon || model('Coupon', couponSchema)

export default Coupon
