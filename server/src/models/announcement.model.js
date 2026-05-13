import mongoose from 'mongoose'

const { Schema, model } = mongoose

const announcementSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: { type: String, required: [true, 'Content is required'], trim: true },
    type: { type: String, enum: ['info', 'alert', 'success'], default: 'info' },
    visibleTo: [{ type: String, enum: ['student', 'teacher', 'admin'] }],
    expiredAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
)

const Announcement = mongoose.models.Announcement || model('Announcement', announcementSchema)

export default Announcement
