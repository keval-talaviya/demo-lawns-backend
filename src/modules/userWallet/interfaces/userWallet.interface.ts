import { Document, Types } from 'mongoose';

// ===============================
// 📘 User Wallet Interfaces
// ===============================

export interface UserWalletTransactionDocument extends Document {
    userId: Types.ObjectId; // Staff/Franchise user
    franchiseId: Types.ObjectId; // Parent franchise
    jobId?: Types.ObjectId; // If transaction is from job completion
    invoiceId?: Types.ObjectId; // If transaction is from invoice
    type: 1 | 2; // 1: Withdraw, 2: Deposit
    amount: number;
    purpose: string; // Description/remarks
    date: Date;
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateUserWalletTransactionDTO {
    userId: Types.ObjectId | string;
    franchiseId: Types.ObjectId | string;
    jobId?: Types.ObjectId | string;
    invoiceId?: Types.ObjectId | string;
    type: 1 | 2;
    amount: number;
    purpose: string;
    date?: Date;
    createdBy: Types.ObjectId | string;
}

export interface UserWalletBalance {
    userId: string;
    userName: string;
    userType: string;
    email: string;
    balance: number;
}
