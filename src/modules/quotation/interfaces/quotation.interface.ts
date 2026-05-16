import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Quotation Interfaces
// ===============================

export interface QuotationItem {
  description: string;
  qty: number;
  rate: number;
  total: number;
}

export interface QuotationDocument extends Document, SoftDeleteDocument {
  uniqueCode?: string;
  franchiseId?: Types.ObjectId | null;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  quotationDate: Date;
  expiryDate?: Date;
  notes?: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 1 | 2 | 3 | 4; // 1: draft, 2: sent, 3: approved, 4: rejected
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuotationDTO {
  franchiseId: Types.ObjectId | string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  quotationDate: Date | string;
  expiryDate?: Date | string;
  notes?: string;
  items: QuotationItem[];
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status?: 1 | 2 | 3 | 4;
  createdBy?: Types.ObjectId | string;
}

export interface UpdateQuotationDTO {
  customerName?: string;
  customerEmail?: string;
  customerAddress?: string;
  quotationDate?: Date | string;
  expiryDate?: Date | string;
  notes?: string;
  items?: QuotationItem[];
  subtotal?: number;
  tax?: number;
  totalAmount?: number;
  status?: 1 | 2 | 3 | 4;
}

export interface QuotationQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
  customerName?: string;
  status?: 1 | 2 | 3 | 4;
}
