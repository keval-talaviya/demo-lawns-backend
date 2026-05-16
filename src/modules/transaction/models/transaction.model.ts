import { Schema, model } from 'mongoose';
import { TransactionDocument } from '../interfaces/transaction.interface';
import { TRANSACTION_TYPE, PAYMENT_TYPE } from '../../../common/constants';

const transactionSchema = new Schema<TransactionDocument>(
    {
        franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
        invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
        type: {
            type: Number,
            enum: Object.values(TRANSACTION_TYPE),
            required: true,
        },
        amount: { type: Number, required: true },
        paymentType: {
            type: Number,
            enum: Object.values(PAYMENT_TYPE),
            required: true,
        },
        remarks: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, default: Date.now },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true },
);

export const TransactionModel = model<TransactionDocument>('Transaction', transactionSchema);
