import mongoose from 'mongoose'

const emailTemplateSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    variables: [{ type: String }],
    isCustomized: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.model('EmailTemplate', emailTemplateSchema)
