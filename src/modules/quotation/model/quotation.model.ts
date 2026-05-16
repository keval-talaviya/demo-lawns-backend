import { Schema, model } from 'mongoose';
import { QuotationDocument } from '../interfaces/quotation.interface';

const quotationSchema = new Schema<QuotationDocument>(
  {
    uniqueCode: { type: String, unique: true, sparse: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerAddress: { type: String, required: true },
    quotationDate: { type: Date, required: true },
    expiryDate: { type: Date },
    notes: { type: String },
    items: [
      {
        description: { type: String, required: true },
        qty: { type: Number, required: true },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: Number,
      enum: [1, 2, 3, 4], // 1: draft, 2: sent, 3: approved, 4: rejected
      default: 1,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const QuotationModel = model<QuotationDocument>('Quotation', quotationSchema);
