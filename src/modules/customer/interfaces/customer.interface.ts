import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Customer Interfaces
// ===============================

export interface CustomerDocument extends Document, SoftDeleteDocument {
  uniqueCode?: string;
  franchiseId: Types.ObjectId | null;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  balance: number;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerDTO {
  franchiseId: Types.ObjectId | string;
  name: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
  createdBy?: Types.ObjectId | string;
}

export interface UpdateCustomerDTO {
  name?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive?: boolean;
}

export interface CustomerQuery {
  page?: number;
  limit?: number;
  franchiseId?: Types.ObjectId | string;
}
