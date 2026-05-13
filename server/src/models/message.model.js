import mongoose from 'mongoose'

const { Schema, model } = mongoose

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
)

messageSchema.index({ sender: 1, receiver: 1 })
messageSchema.index({ createdAt: -1 })

const Message = mongoose.models.Message || model('Message', messageSchema)

export default Message
