"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceModel = void 0;
const mongoose_1 = require("mongoose");
const invoiceSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Job' },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.InvoiceModel = (0, mongoose_1.model)('Invoice', invoiceSchema);
//# sourceMappingURL=invoice.model.js.map