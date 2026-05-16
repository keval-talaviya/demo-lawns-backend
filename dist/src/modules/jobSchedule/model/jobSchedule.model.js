"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScheduleModel = void 0;
const mongoose_1 = require("mongoose");
const jobScheduleSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job', required: true },
    scheduledDate: { type: Date, required: true },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    status: {
        type: Number,
        enum: [1, 2, 3], // 1: scheduled, 2: completed, 3: cancelled
        default: 1,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.JobScheduleModel = (0, mongoose_1.model)('JobSchedule', jobScheduleSchema);
//# sourceMappingURL=jobSchedule.model.js.map