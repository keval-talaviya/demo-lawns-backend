"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobModel = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../../common");
const JobItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
}, { _id: false });
const jobSchema = new mongoose_1.Schema({
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    quotationId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quotation' },
    customerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true },
    assignedTo: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    jobDate: { type: Date },
    jobType: {
        type: Number,
        enum: Object.values(common_1.JOB_TYPE),
        default: common_1.JOB_TYPE.ONE_TIME,
    },
    frequencyValue: { type: Number },
    frequencyUnit: {
        type: Number,
        enum: Object.values(common_1.FREQUENCY_UNIT),
    },
    amount: { type: Number, default: 0 },
    paymentType: {
        type: Number,
        enum: Object.values(common_1.PAYMENT_TYPE),
    },
    invoiceEmails: [{ type: String }],
    jobAddress: { type: String },
    items: { type: [JobItemSchema], default: [] },
    notes: { type: String },
    status: {
        type: Number,
        enum: Object.values(common_1.JOB_STATUS),
        default: common_1.JOB_STATUS.PENDING,
    },
    completedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    completionDate: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    transactionHistory: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Invoice' }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.JobModel = (0, mongoose_1.model)('Job', jobSchema);
//# sourceMappingURL=job.model.js.map