import mongoose from 'mongoose'

const { Schema, model } = mongoose

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    bannerText: {
      type: String,
      trim: true,
      maxlength: [200, 'Banner text cannot exceed 200 characters'],
      default: '',
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
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
  },
  { timestamps: true, versionKey: false }
)

// ─── Percentage upper bound ───────────────────────────────────────────────────
offerSchema.pre('validate', function () {
  if (this.discountType === 'percentage' && this.discountValue > 100) {
    this.invalidate('discountValue', 'Percentage discount cannot exceed 100')
  }
})

offerSchema.index({ isActive: 1, scope: 1 })
offerSchema.index({ course: 1, isActive: 1 })

const Offer = mongoose.models.Offer || model('Offer', offerSchema)

export default Offer
