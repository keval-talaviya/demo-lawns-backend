import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Job Interfaces
// ===============================

export interface JobItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

export interface JobDocument extends Document, SoftDeleteDocument {
  franchiseId: Types.ObjectId;
  quotationId?: Types.ObjectId;
  customerId: Types.ObjectId;
  // jobTitle and jobDescription removed per client change
  assignedTo?: Types.ObjectId;
  jobDate?: Date;
  jobType: 1 | 2; // 1: one-time, 2: recurring
  frequencyValue?: number;
  frequencyUnit?: 1 | 2 | 3 | 4; // 1: days, 2: weeks, 3: months, 4: years
  amount: number;
  paymentType?: 1 | 2 | 3 | 4 | 5; // 1: bank_transfer, 2: cash, 3: card, 4: cheque, 5: other
  invoiceEmails?: string[];
  items: JobItem[];
  notes?: string;
  status: 1 | 2 | 3 | 4 | 5; // 1: pending, 2: in_progress, 3: completed, 4: cancelled, 5: overdue
  createdBy?: Types.ObjectId;
  transactionHistory?: Types.ObjectId[];
  createdAt: Date;
  jobAddress: string;
  updatedAt: Date;
  completedBy?: Types.ObjectId;
  completionDate?: Date;
}

export interface CreateJobDTO {
  franchiseId: Types.ObjectId | string;
  quotationId?: Types.ObjectId | string;
  customerId: Types.ObjectId | string;
  // jobTitle and jobDescription removed per client change
  assignedTo?: Types.ObjectId | string;
  jobDate?: Date;
  jobType?: 1 | 2;
  frequencyValue?: number;
  frequencyUnit?: 1 | 2 | 3 | 4;
  amount?: number;
  paymentType?: 1 | 2 | 3 | 4 | 5;
  invoiceEmails?: string[];
  jobAddress?: string;
  items?: JobItem[];
  notes?: string;
  status?: 1 | 2 | 3 | 4 | 5;
  createdBy?: Types.ObjectId | string;
}

export interface UpdateJobDTO {
  quotationId?: Types.ObjectId | string;
  customerId?: Types.ObjectId | string;
  // jobTitle and jobDescription removed per client change
  assignedTo?: Types.ObjectId | string;
  jobDate?: Date;
  jobType?: 1 | 2;
  frequencyValue?: number;
  frequencyUnit?: 1 | 2 | 3 | 4;
  amount?: number;
  paymentType?: 1 | 2 | 3 | 4 | 5;
  invoiceEmails?: string[];
  items?: JobItem[];
  notes?: string;
  status?: 1 | 2 | 3 | 4 | 5;
}

export interface JobQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  customerId?: Types.ObjectId | string;
  status?: 1 | 2 | 3 | 4 | 5;
}
