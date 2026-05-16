import { Schema, model } from 'mongoose';
import { JobDocument } from '../interfaces/job.interface';
import { JOB_STATUS, JOB_TYPE, FREQUENCY_UNIT, PAYMENT_TYPE } from '../../../common';

const JobItemSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobSchema = new Schema<JobDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    quotationId: { type: Schema.Types.ObjectId, ref: 'Quotation' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    jobDate: { type: Date },
    jobType: {
      type: Number,
      enum: Object.values(JOB_TYPE),
      default: JOB_TYPE.ONE_TIME,
    },
    frequencyValue: { type: Number },
    frequencyUnit: {
      type: Number,
      enum: Object.values(FREQUENCY_UNIT),
    },
    amount: { type: Number, default: 0 },
    paymentType: {
      type: Number,
      enum: Object.values(PAYMENT_TYPE),
    },
    invoiceEmails: [{ type: String }],
    jobAddress: { type: String },
    items: { type: [JobItemSchema], default: [] },
    notes: { type: String },
    status: {
      type: Number,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.PENDING,
    },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completionDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    transactionHistory: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const JobModel = model<JobDocument>('Job', jobSchema);
