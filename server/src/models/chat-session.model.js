import mongoose from 'mongoose'

const { Schema, model } = mongoose

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: false }
)

// One ongoing chat session per signed-in user (single thread). Guests are stored
// client-side in localStorage; only authenticated users are persisted here.
const chatSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
)

const ChatSession = mongoose.models.ChatSession || model('ChatSession', chatSessionSchema)

export default ChatSession
