import mongoose from 'mongoose'

const { Schema, model } = mongoose

const contactSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: { type: String, required: [true, 'Message is required'], trim: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

const Contact = mongoose.models.Contact || model('Contact', contactSchema)

export default Contact
