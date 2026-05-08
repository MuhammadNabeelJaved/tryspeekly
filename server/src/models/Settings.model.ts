import mongoose, { Schema, Document } from 'mongoose';

interface IPaymentInstruction {
  method: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
  swiftCode?: string;
  instructions: string;
}

export interface ISettings extends Document {
  platformName: string;
  logo?: string;
  contactEmail: string;
  paymentInstructions: IPaymentInstruction[];
  emailNotifications: {
    enrollmentConfirmation: boolean;
    paymentApproval: boolean;
    paymentRejection: boolean;
  };
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>({
  platformName: { type: String, default: 'English Learning LMS' },
  logo: { type: String },
  contactEmail: { type: String, required: true },
  paymentInstructions: [{
    method: { type: String, required: true },
    accountName: { type: String },
    accountNumber: { type: String },
    iban: { type: String },
    swiftCode: { type: String },
    instructions: { type: String, required: true },
  }],
  emailNotifications: {
    enrollmentConfirmation: { type: Boolean, default: true },
    paymentApproval: { type: Boolean, default: true },
    paymentRejection: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default mongoose.model<ISettings>('Settings', settingsSchema);
