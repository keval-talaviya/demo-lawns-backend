"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../../common/constants");
const transactionSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    invoiceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' },
    type: {
        type: Number,
        enum: Object.values(constants_1.TRANSACTION_TYPE),
        required: true,
    },
    amount: { type: Number, required: true },
    paymentType: {
        type: Number,
        enum: Object.values(constants_1.PAYMENT_TYPE),
        required: true,
    },
    remarks: { type: String },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.TransactionModel = (0, mongoose_1.model)('Transaction', transactionSchema);
//# sourceMappingURL=transaction.model.js.map