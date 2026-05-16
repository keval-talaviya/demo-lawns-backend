"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportModel = void 0;
const mongoose_1 = require("mongoose");
const reportSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: Number,
        enum: [1, 2, 3], // 1: daily, 2: monthly, 3: yearly
        required: true,
    },
    period: { type: String, required: true }, // e.g. '2025-11', '2025-11-07'
    totalRevenue: { type: Number },
    totalExpenses: { type: Number },
    netProfit: { type: Number },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.ReportModel = (0, mongoose_1.model)('Report', reportSchema);
//# sourceMappingURL=report.model.js.map