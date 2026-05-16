"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyReportModel = void 0;
const mongoose_1 = require("mongoose");
const dailyReportSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reportDate: { type: Date, default: Date.now },
    totalJobs: { type: Number },
    completedJobs: { type: Number },
    totalIncome: { type: Number },
    cashCollected: { type: Number },
    remarks: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.DailyReportModel = (0, mongoose_1.model)('DailyReport', dailyReportSchema);
//# sourceMappingURL=dailyReport.model.js.map