import { Schema, model, Document, Types } from 'mongoose';

export interface CompanySettingsDocument extends Document {
  companyName: string;
  companyLogo: string;
  gstNumber: string;
  gstRate: number;

  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySettingsSchema = new Schema<CompanySettingsDocument>(
  {
    companyName: { type: String, required: true },
    companyLogo: { type: String, default: '' },
    gstNumber: { type: String, required: true },
    gstRate: { type: Number, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CompanySettingsModel = model<CompanySettingsDocument>('CompanySettings', companySettingsSchema);
