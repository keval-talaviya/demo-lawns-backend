import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - User Interfaces
// ===============================

export interface UserDocument extends Document, SoftDeleteDocument {
  uniqueCode?: string | null;
  isFranchise: boolean;
  address?: string | null;
  email?: string | null;
  parentId?: Types.ObjectId | null;
  isActive: boolean;
  role: 1 | 2 | 3;
  name: string;
  countryCode: number;
  accountNumber:string;
  password: string;
  phoneNumber?: number | null;
  permissions?: string[] | null;
  lastLogin?: Date | null;
  logo?: string | null;
  gstNumber?: string | null;
  balance: number;
  createdBy?: Types.ObjectId | string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  isFranchise?: boolean;
  address?: string;
  email?: string;
  parentId?: Types.ObjectId | string | null;
  role?: 1 | 2 | 3;
  name?: string;
  password?: string;
  phoneNumber?: string;
  countryCode?: number;
  accountNumber:number;
  permissions?: string[];
  createdBy?: Types.ObjectId | string;
}

export interface UpdateUserDTO {
  isFranchise?: boolean;
  franchiseCode?: string;
  franchiseName?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: Types.ObjectId | string | null;
  role?: 1 | 2 | 3;
  name?: string;
  username?: string;
  userEmail?: string;
  password?: string;
  phoneNumber?: string;
  permissions?: string[];
  accountNumber?:string;
  status?: 1 | 2;
  isActive?: boolean;
  logo?: string | null;
  gstNumber?: string | null;
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  parentId?: Types.ObjectId | string;
  role?: 1 | 2 | 3;
  status?: 1 | 2;
}
