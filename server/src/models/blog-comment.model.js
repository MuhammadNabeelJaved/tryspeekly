import mongoose from 'mongoose'

const { Schema, model } = mongoose

const blogCommentSchema = new Schema(
  {
    blog: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [2, 'Comment must be at least 2 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
)

blogCommentSchema.index({ blog: 1, status: 1, createdAt: -1 })

blogCommentSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

const BlogComment = mongoose.models.BlogComment || model('BlogComment', blogCommentSchema)

export default BlogComment
