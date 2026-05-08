import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  room: string;
  sender: mongoose.Types.ObjectId;
  content: string;
  type: 'group' | 'private' | 'support';
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  room: { type: String, required: true, index: true },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['group', 'private', 'support'],
    required: true
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

messageSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
