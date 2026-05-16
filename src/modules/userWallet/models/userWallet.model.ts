import { Schema, model } from 'mongoose';
import { UserWalletTransactionDocument } from '../interfaces/userWallet.interface';

const userWalletTransactionSchema = new Schema<UserWalletTransactionDocument>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
        type: {
            type: Number,
            enum: [1, 2], // 1: Withdraw, 2: Deposit
            required: true,
        },
        amount: { type: Number, required: true },
        purpose: { type: String, required: true },
        date: { type: Date, default: Date.now },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

// Index for faster balance calculations
userWalletTransactionSchema.index({ userId: 1, isDeleted: 1 });
userWalletTransactionSchema.index({ franchiseId: 1, isDeleted: 1 });

export const UserWalletTransactionModel = model<UserWalletTransactionDocument>(
    'UserWalletTransaction',
    userWalletTransactionSchema
);
