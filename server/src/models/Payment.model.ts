import mongoose, { Schema, Document } from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHODS, CURRENCIES } from '../config/constants';

export interface IPayment extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  method: typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
  transactionId: string;
  screenshotUrl: string;
  amount: number;
  currency: typeof CURRENCIES[keyof typeof CURRENCIES];
  status: typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
  adminNote?: string;
  rejectionReason?: string;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: Object.values(PAYMENT_METHODS),
    required: true
  },
  transactionId: { type: String, required: true },
  screenshotUrl: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: {
    type: String,
    enum: Object.values(CURRENCIES),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  adminNote: { type: String },
  rejectionReason: { type: String },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
}, { timestamps: true });

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ student: 1 });
paymentSchema.index({ course: 1 });

export default mongoose.model<IPayment>('Payment', paymentSchema);
