import mongoose from 'mongoose'

const { Schema, model } = mongoose

const teamNotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    added:     { type: [String], default: [] },
    removed:   { type: [String], default: [] },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
)

teamNotificationSchema.index({ recipient: 1, createdAt: -1 })

const TeamNotification =
  mongoose.models.TeamNotification || model('TeamNotification', teamNotificationSchema)

export default TeamNotification
