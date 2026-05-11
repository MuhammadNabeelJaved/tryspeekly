import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  content: { type: String, required: true },
  excerpt: { type: String, trim: true },
  coverImage: { type: String },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: { type: Date }
}, { timestamps: true });

// Pre-save hook to generate slug if not present
blogSchema.pre('validate', function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// Indexes
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ author: 1 });
blogSchema.index({ tags: 1 });

export default mongoose.model<IBlog>('Blog', blogSchema);
