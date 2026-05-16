"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const companySettings_model_1 = require("../../companySettings/model/companySettings.model");
const base_dao_1 = require("../../../db/base.dao");
const quotation_model_1 = require("../model/quotation.model");
const serialNumber_service_1 = require("../../../common/serialNumber.service");
class QuotationServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(quotation_model_1.QuotationModel);
    }
    async createQuotation(payload, franchiseId) {
        // Generate unique code: QUOT-0001
        const uniqueCode = await serialNumber_service_1.SerialNumberService.generateUniqueCode({
            prefix: 'QUOT-',
            padding: 4,
            model: quotation_model_1.QuotationModel,
        });
        return this.create({
            ...payload,
            franchiseId,
            uniqueCode,
        });
    }
    async updateQuotation(id, payload) {
        return this.updateById(id, payload);
    }
    async getQuotationsByFranchise(franchiseId, options = {}) {
        return this.paginateQuotations({ franchiseId }, options);
    }
    async paginateQuotations(filter = {}, options = {}) {
        const [result, companySettings] = await Promise.all([
            super.paginate(filter, options),
            companySettings_model_1.CompanySettingsModel.findOne().lean(),
        ]);
        const gstRate = companySettings?.gstRate || 15;
        // Recalculate tax and subtotal for display
        const sanitizedData = result.data.map((doc) => {
            const q = doc instanceof quotation_model_1.QuotationModel ? doc.toObject() : doc; // Fallback for docs with missing tax breakdown
            const totalAmount = q.totalAmount || 0;
            const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
            const tax = Number((totalAmount - subtotal).toFixed(2));
            return {
                ...q,
                subtotal,
                tax,
            };
        });
        return {
            ...result,
            data: sanitizedData,
        };
    }
    async getQuotationById(id) {
        const [doc, companySettings] = await Promise.all([
            this.findById(id),
            companySettings_model_1.CompanySettingsModel.findOne().lean(),
        ]);
        if (!doc)
            return null;
        const gstRate = companySettings?.gstRate || 15;
        const q = doc instanceof quotation_model_1.QuotationModel ? doc.toObject() : doc; // Fallback recalculation
        const totalAmount = q.totalAmount || 0;
        const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
        const tax = Number((totalAmount - subtotal).toFixed(2));
        return {
            ...q,
            subtotal,
            tax,
        };
    }
}
exports.QuotationService = new QuotationServiceClass();
//# sourceMappingURL=quotation.service.js.map