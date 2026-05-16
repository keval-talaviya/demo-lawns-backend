import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Report Interfaces
// ===============================

export interface ReportDocument extends Document, SoftDeleteDocument {
  franchiseId: Types.ObjectId;
  type: 1 | 2 | 3; // 1: daily, 2: monthly, 3: yearly
  period: string; // e.g. '2025-11', '2025-11-07'
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  createdAt: Date;
}

export interface CreateReportDTO {
  franchiseId: Types.ObjectId | string;
  type: 1 | 2 | 3;
  period: string;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
}

export interface UpdateReportDTO {
  type?: 1 | 2 | 3;
  period?: string;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
}

export interface ReportQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  type?: 1 | 2 | 3;
  period?: string;
}
