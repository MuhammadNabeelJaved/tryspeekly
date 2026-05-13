import mongoose from 'mongoose'

const { Schema, model } = mongoose

const faqSchema = new Schema(
  {
    question: { type: String, required: [true, 'Question is required'], trim: true },
    answer: { type: String, required: [true, 'Answer is required'], trim: true },
    category: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
)

faqSchema.index({ order: 1 })

const FAQ = mongoose.models.FAQ || model('FAQ', faqSchema)

export default FAQ
