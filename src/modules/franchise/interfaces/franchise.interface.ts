import { Document, Types } from 'mongoose';
import { SoftDeleteDocument } from '../../../db/base.dao';

// ===============================
// 📘 AB Lawas - Franchise Interfaces
// ===============================

export interface FranchiseDocument extends Document, SoftDeleteDocument {
  uniqueCode?: string;
  password?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  countryCode: number;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFranchiseDTO {
  name: string;
  address: string;
  password: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  countryCode: number;
  email: string;
  isActive?: boolean;
}

export interface UpdateFranchiseDTO {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  countryCode?: number;
  email?: string;
  isActive?: boolean;
}

export interface FranchiseQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
