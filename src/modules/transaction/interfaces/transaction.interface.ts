import { Document, Types } from 'mongoose';

export interface TransactionDocument extends Document {
    franchiseId: Types.ObjectId;
    customerId: Types.ObjectId;
    invoiceId?: Types.ObjectId;
    type: number; // 1: WITHDRAW, 2: DEPOSIT
    amount: number;
    paymentType: number; // 1: BANK_TRANSFER, 2: CASH, 3: DROP_INVOICE
    remarks?: string;
    createdBy: Types.ObjectId;
    date: Date;
    isDeleted: boolean;
    deletedAt: Date | null;
}
