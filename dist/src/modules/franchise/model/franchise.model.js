"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseModel = void 0;
const mongoose_1 = require("mongoose");
const franchiseSchema = new mongoose_1.Schema({
    uniqueCode: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    countryCode: { type: Number, required: true },
    email: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.FranchiseModel = (0, mongoose_1.model)('Franchise', franchiseSchema);
//# sourceMappingURL=franchise.model.js.map