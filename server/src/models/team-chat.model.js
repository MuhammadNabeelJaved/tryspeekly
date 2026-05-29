import mongoose from 'mongoose'

const { Schema, model } = mongoose

const teamChatSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

teamChatSchema.index({ from: 1, to: 1, createdAt: 1 })

const TeamChat = mongoose.models.TeamChat || model('TeamChat', teamChatSchema)

export default TeamChat
