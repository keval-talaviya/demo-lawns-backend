import { Schema, model } from 'mongoose';
import { JobScheduleDocument } from '../interfaces/jobSchedule.interface';

const jobScheduleSchema = new Schema<JobScheduleDocument>(
  {
    franchiseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    scheduledDate: { type: Date, required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    status: {
      type: Number,
      enum: [1, 2, 3], // 1: scheduled, 2: completed, 3: cancelled
      default: 1,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const JobScheduleModel = model<JobScheduleDocument>('JobSchedule', jobScheduleSchema);
