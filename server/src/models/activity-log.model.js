import mongoose from 'mongoose'

const activityLogSchema = new mongoose.Schema(
  {
    teamMember:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:       { type: String, enum: ['create','update','delete','approve','reject','send','other'], required: true },
    resource:     { type: String, required: true },
    resourceId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    resourceName: { type: String, default: '' },
    details:      { type: String, default: '' },
    ip:           { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
)

activityLogSchema.index({ teamMember: 1, createdAt: -1 })
activityLogSchema.index({ resource: 1, createdAt: -1 })
activityLogSchema.index({ createdAt: -1 })

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema)
