import { Schema, model } from 'mongoose';
import { InvoiceDocument } from '../interfaces/invoice.interface';

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: {
      type: Number,
      enum: [1, 2, 3, 4, 5], // 1: unpaid, 2: partial, 3: paid, 4: cancelled, 5: overdue
      default: 1,
    },
    paymentType: { type: Number }, // 1: Bank Transfer, 2: Cash, 3: Drop Invoice
    issuedDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const InvoiceModel = model<InvoiceDocument>('Invoice', invoiceSchema);
