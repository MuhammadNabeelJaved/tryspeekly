import mongoose from 'mongoose'

const { Schema, model } = mongoose

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: [true, 'Blog content is required'] },
    excerpt: {
      type: String,
      trim: true,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    coverImage: { type: String, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

blogSchema.pre(/^find/, function () {
  this.where({ isDeleted: false })
})

blogSchema.pre('save', function () {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }
})

const Blog = mongoose.models.Blog || model('Blog', blogSchema)

export default Blog
