"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuotationSchema = exports.createQuotationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createQuotationSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    customerName: joi_1.default.string().required(),
    customerEmail: joi_1.default.string().email().required(),
    customerAddress: joi_1.default.string().required(),
    quotationDate: joi_1.default.date().iso().required(),
    expiryDate: joi_1.default.date().iso().optional(),
    notes: joi_1.default.string().allow(null, '').optional(),
    items: joi_1.default.array()
        .items(joi_1.default.object({
        description: joi_1.default.string().required(),
        qty: joi_1.default.number().required(),
        rate: joi_1.default.number().required(),
        total: joi_1.default.number().required(),
    }))
        .min(1)
        .required(),
    subtotal: joi_1.default.number().required(),
    tax: joi_1.default.number().default(0),
    totalAmount: joi_1.default.number().required(),
    status: joi_1.default.number().valid(1, 2, 3, 4).default(1),
    createdBy: joi_1.default.string().optional(),
});
exports.updateQuotationSchema = joi_1.default.object({
    customerName: joi_1.default.string().optional(),
    customerEmail: joi_1.default.string().email().optional(),
    customerAddress: joi_1.default.string().optional(),
    quotationDate: joi_1.default.date().iso().optional(),
    expiryDate: joi_1.default.date().iso().optional(),
    notes: joi_1.default.string().allow(null, '').optional(),
    items: joi_1.default.array().items(joi_1.default.object({
        description: joi_1.default.string().required(),
        qty: joi_1.default.number().required(),
        rate: joi_1.default.number().required(),
        total: joi_1.default.number().required(),
    })),
    subtotal: joi_1.default.number().optional(),
    tax: joi_1.default.number().optional(),
    totalAmount: joi_1.default.number().optional(),
    status: joi_1.default.number().valid(1, 2, 3, 4).optional(),
});
//# sourceMappingURL=quotation.validator.js.map