import { Schema, model } from 'mongoose';
import { ReportDocument } from '../interfaces/report.interface';

const reportSchema = new Schema<ReportDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: Number,
      enum: [1, 2, 3], // 1: daily, 2: monthly, 3: yearly
      required: true,
    },
    period: { type: String, required: true }, // e.g. '2025-11', '2025-11-07'
    totalRevenue: { type: Number },
    totalExpenses: { type: Number },
    netProfit: { type: Number },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const ReportModel = model<ReportDocument>('Report', reportSchema);
