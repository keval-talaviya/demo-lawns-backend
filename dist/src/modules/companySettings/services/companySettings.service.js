"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettingsService = void 0;
const companySettings_model_1 = require("../model/companySettings.model");
class CompanySettingsService {
    /**
     * Create company settings
     */
    static async create(data) {
        const settings = new companySettings_model_1.CompanySettingsModel({
            ...data,
            updatedBy: data.createdBy,
        });
        return await settings.save();
    }
    /**
     * Get company settings (should only be one record)
     */
    static async get() {
        return await companySettings_model_1.CompanySettingsModel.findOne().lean();
    }
    /**
     * Update company settings
     */
    static async update(id, data) {
        return await companySettings_model_1.CompanySettingsModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
    }
    /**
     * Check if company settings exist
     */
    static async exists() {
        const count = await companySettings_model_1.CompanySettingsModel.countDocuments();
        return count > 0;
    }
    /**
     * Find by ID
     */
    static async findById(id) {
        return await companySettings_model_1.CompanySettingsModel.findById(id).lean();
    }
}
exports.CompanySettingsService = CompanySettingsService;
//# sourceMappingURL=companySettings.service.js.map