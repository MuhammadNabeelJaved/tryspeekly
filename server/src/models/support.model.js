import mongoose from 'mongoose'

const { Schema, model } = mongoose

const supportMessageSchema = new Schema(
  {
    sender: { type: String, enum: ['student', 'admin'], required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: [true, 'Message content is required'], trim: true },
  },
  { timestamps: true }
)

const supportTicketSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course' },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    description: { type: String, required: [true, 'Description is required'], trim: true },
    status: { type: String, enum: ['open', 'pending', 'closed'], default: 'open' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    messages: [supportMessageSchema],
    lastMessageAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
)

supportTicketSchema.index({ student: 1, status: 1 })

const SupportTicket = mongoose.models.SupportTicket || model('SupportTicket', supportTicketSchema)

export default SupportTicket
