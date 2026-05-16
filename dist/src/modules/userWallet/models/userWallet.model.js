"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWalletTransactionModel = void 0;
const mongoose_1 = require("mongoose");
const userWalletTransactionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job' },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    type: {
        type: Number,
        enum: [1, 2], // 1: Withdraw, 2: Deposit
        required: true,
    },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
// Index for faster balance calculations
userWalletTransactionSchema.index({ userId: 1, isDeleted: 1 });
userWalletTransactionSchema.index({ franchiseId: 1, isDeleted: 1 });
exports.UserWalletTransactionModel = (0, mongoose_1.model)('UserWalletTransaction', userWalletTransactionSchema);
//# sourceMappingURL=userWallet.model.js.map