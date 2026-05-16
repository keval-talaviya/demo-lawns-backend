"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerModel = void 0;
const mongoose_1 = require("mongoose");
const customerSchema = new mongoose_1.Schema({
    uniqueCode: { type: String, unique: true, sparse: true },
    franchiseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
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
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.CustomerModel = (0, mongoose_1.model)('Customer', customerSchema);
//# sourceMappingURL=customer.model.js.map