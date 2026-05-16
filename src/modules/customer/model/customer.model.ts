import { Schema, model } from 'mongoose';
import { CustomerDocument } from '../interfaces/customer.interface';
export { CustomerDocument };

const customerSchema = new Schema<CustomerDocument>(
  {
    uniqueCode: { type: String, unique: true, sparse: true },
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    companyName: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    postalCode: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const CustomerModel = model<CustomerDocument>('Customer', customerSchema);
