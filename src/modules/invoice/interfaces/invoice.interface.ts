import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Invoice Interfaces
// ===============================

export interface InvoiceItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

export interface InvoiceDocument extends Document, SoftDeleteDocument {
  franchiseId: Types.ObjectId;
  invoiceNumber: string;
  customerId: Types.ObjectId;
  jobId?: Types.ObjectId;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: 1 | 2 | 3 | 4 | 5; // 1: unpaid, 2: partial, 3: paid, 4: cancelled, 5: overdue
  paymentType?: number;
  issuedDate?: Date;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDTO {
  franchiseId: Types.ObjectId | string;
  invoiceNumber: string;
  customerId: Types.ObjectId | string;
  jobId?: Types.ObjectId | string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  totalAmount: number;
  paidAmount?: number;
  dueAmount?: number;
  status?: 1 | 2 | 3 | 4 | 5;
  paymentType?: number;
  issuedDate?: Date;
  createdBy?: Types.ObjectId | string;
  transactionRemarks?: string;
}

export interface UpdateInvoiceDTO {
  invoiceNumber?: string;
  customerId?: Types.ObjectId | string;
  jobId?: Types.ObjectId | string;
  items?: InvoiceItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  status?: 1 | 2 | 3 | 4 | 5;
  paymentType?: number;
  issuedDate?: Date;
}

export interface InvoiceQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  customerId?: Types.ObjectId | string;
  status?: 1 | 2 | 3 | 4 | 5;
}
