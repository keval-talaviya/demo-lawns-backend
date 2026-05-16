import { Schema, model } from 'mongoose';
import { DailyReportDocument } from '../interfaces/dailyReport.interface';

const dailyReportSchema = new Schema<DailyReportDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportDate: { type: Date, default: Date.now },
    totalJobs: { type: Number },
    completedJobs: { type: Number },
    totalIncome: { type: Number },
    cashCollected: { type: Number },
    remarks: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const DailyReportModel = model<DailyReportDocument>('DailyReport', dailyReportSchema);
