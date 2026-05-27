import mongoose from 'mongoose'

const { Schema, model } = mongoose

const referralRewardSchema = new Schema(
  {
    referrer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    referee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollment: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    discountGiven: { type: Number, required: [true, 'Discount given is required'] },
    rewardAmount: { type: Number, required: [true, 'Reward amount is required'] },
    status: {
      type: String,
      enum: ['pending', 'credited', 'paid_out'],
      default: 'pending',
    },
    creditedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
)

referralRewardSchema.index({ referrer: 1, status: 1 })
referralRewardSchema.index({ referee: 1 })
referralRewardSchema.index({ payment: 1 }, { unique: true })

const ReferralReward = mongoose.models.ReferralReward || model('ReferralReward', referralRewardSchema)

export default ReferralReward
