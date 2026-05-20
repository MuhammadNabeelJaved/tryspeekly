import mongoose from 'mongoose'

const { Schema, model } = mongoose

const reviewSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['platform', 'course'],
      required: [true, 'Review type is required'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      validate: {
        validator: function (v) {
          return this.type !== 'course' || v != null
        },
        message: 'course is required when type is "course"',
      },
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    content: {
      type: String,
      required: [true, 'Review content is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [1000, 'Review cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    featuredOnHome: {
      type: Boolean,
      default: false,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
)

// ─── Indexes ──────────────────────────────────────────────────────────────────
// One platform review per user
reviewSchema.index(
  { author: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'platform' } }
)
// One course review per student per course
reviewSchema.index(
  { author: 1, course: 1 },
  { unique: true, partialFilterExpression: { type: 'course' } }
)
// Fast home page query
reviewSchema.index({ status: 1, featuredOnHome: 1 })
// Fast course review listing
reviewSchema.index({ course: 1, status: 1 })

// ─── Middleware ───────────────────────────────────────────────────────────────
reviewSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const Review = mongoose.models.Review || model('Review', reviewSchema)

export default Review
