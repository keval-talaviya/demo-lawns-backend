"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePaymentSchema = exports.updateInvoiceSchema = exports.createInvoiceSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const invoiceItemSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        'any.required': 'Item name is required.',
    }),
    description: joi_1.default.string().optional().allow('').max(500).messages({
        'string.max': 'Item description cannot exceed 500 characters.',
    }),
    quantity: joi_1.default.number().required().min(1).messages({
        'any.required': 'Item quantity is required.',
        'number.min': 'Item quantity must be at least 1.',
    }),
    unitPrice: joi_1.default.number().required().min(0).messages({
        'any.required': 'Item unit price is required.',
        'number.min': 'Item unit price cannot be negative.',
    }),
    price: joi_1.default.number().required().min(0).messages({
        'any.required': 'Item price is required.',
        'number.min': 'Item price cannot be negative.',
    }),
});
exports.createInvoiceSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    invoiceNumber: joi_1.default.string().optional(),
    customerId: joi_1.default.string().required().messages({
        'any.required': 'Customer ID is required.',
    }),
    jobId: joi_1.default.string().optional(),
    items: joi_1.default.array().items(invoiceItemSchema).min(1).required().messages({
        'any.required': 'At least one item is required.',
        'array.min': 'At least one item is required.',
    }),
    tax: joi_1.default.number().min(0).default(0).messages({
        'number.min': 'Tax cannot be negative.',
    }),
    paidAmount: joi_1.default.number().min(0).default(0).messages({
        'number.min': 'Paid amount cannot be negative.',
    }),
    issuedDate: joi_1.default.date().optional(),
    status: joi_1.default.number().valid(1, 2, 3).optional().default(1), // 1: unpaid, 2: partial, 3: paid
});
exports.updateInvoiceSchema = joi_1.default.object({
    invoiceNumber: joi_1.default.string().optional(),
    customerId: joi_1.default.string().optional(),
    jobId: joi_1.default.string().optional(),
    items: joi_1.default.array().items(invoiceItemSchema).optional(),
    tax: joi_1.default.number().min(0).optional().messages({
        'number.min': 'Tax cannot be negative.',
    }),
    paidAmount: joi_1.default.number().min(0).optional().messages({
        'number.min': 'Paid amount cannot be negative.',
    }),
    issuedDate: joi_1.default.date().optional(),
    status: joi_1.default.number().valid(1, 2, 3).optional(),
});
exports.updatePaymentSchema = joi_1.default.object({
    paidAmount: joi_1.default.number().required().min(0).messages({
        'any.required': 'Paid amount is required.',
        'number.min': 'Paid amount cannot be negative.',
    }),
});
//# sourceMappingURL=invoice.validator.js.map