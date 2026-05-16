import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Daily Report Interfaces
// ===============================

export interface DailyReportDocument extends Document, SoftDeleteDocument {
  franchiseId: Types.ObjectId;
  reportDate: Date;
  totalJobs?: number;
  completedJobs?: number;
  totalIncome?: number;
  cashCollected?: number;
  remarks?: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

export interface CreateDailyReportDTO {
  franchiseId: Types.ObjectId | string;
  reportDate?: Date;
  totalJobs?: number;
  completedJobs?: number;
  totalIncome?: number;
  cashCollected?: number;
  remarks?: string;
  createdBy?: Types.ObjectId | string;
}

export interface UpdateDailyReportDTO {
  reportDate?: Date;
  totalJobs?: number;
  completedJobs?: number;
  totalIncome?: number;
  cashCollected?: number;
  remarks?: string;
}

export interface DailyReportQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  reportDate?: Date;
}
