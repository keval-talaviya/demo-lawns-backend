import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Job Schedule Interfaces
// ===============================

export interface JobScheduleDocument extends Document, SoftDeleteDocument {
  franchiseId: Types.ObjectId;
  jobId: Types.ObjectId;
  scheduledDate: Date;
  assignedTo?: Types.ObjectId;
  remarks?: string;
  status: 1 | 2 | 3; // 1: scheduled, 2: completed, 3: cancelled
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJobScheduleDTO {
  franchiseId: Types.ObjectId | string;
  jobId: Types.ObjectId | string;
  scheduledDate: Date;
  assignedTo?: Types.ObjectId | string;
  remarks?: string;
  status?: 1 | 2 | 3;
}

export interface UpdateJobScheduleDTO {
  scheduledDate?: Date;
  assignedTo?: Types.ObjectId | string;
  remarks?: string;
  status?: 1 | 2 | 3;
}

export interface JobScheduleQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  jobId?: Types.ObjectId | string;
  status?: 1 | 2 | 3;
}
