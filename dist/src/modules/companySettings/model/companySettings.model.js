"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettingsModel = void 0;
const mongoose_1 = require("mongoose");
const companySettingsSchema = new mongoose_1.Schema({
    companyName: { type: String, required: true },
    companyLogo: { type: String, default: '' },
    gstNumber: { type: String, required: true },
    gstRate: { type: Number, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });
exports.CompanySettingsModel = (0, mongoose_1.model)('CompanySettings', companySettingsSchema);
//# sourceMappingURL=companySettings.model.js.map