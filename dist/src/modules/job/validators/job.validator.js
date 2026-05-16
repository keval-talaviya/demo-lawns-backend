"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobSchema = exports.createJobSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const jobItemSchema = joi_1.default.object({
    name: joi_1.default.string().required().messages({
        'any.required': 'Item name is required.',
    }),
    description: joi_1.default.string().allow('', null).optional(),
    quantity: joi_1.default.number().min(1).default(1).messages({
        'number.min': 'Quantity must be at least 1.',
    }),
    unitPrice: joi_1.default.number().min(0).default(0).messages({
        'number.min': 'Unit price cannot be negative.',
    }),
    price: joi_1.default.number().min(0).default(0).messages({
        'number.min': 'Price cannot be negative.',
    }),
});
exports.createJobSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    quotationId: joi_1.default.string().optional(),
    customerId: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.forbidden().messages({
            'any.unknown': 'Customer ID should not be provided when creating a new customer.',
        }),
        otherwise: joi_1.default.required().messages({
            'any.required': 'Customer ID is required.',
        }),
    }),
    isNewCustomer: joi_1.default.boolean().default(false),
    customerName: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.string().required().min(2).max(100).messages({
            'any.required': 'Customer name is required when creating a new customer.',
            'string.min': 'Customer name must be at least 2 characters long.',
            'string.max': 'Customer name cannot exceed 100 characters.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    customerEmail: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.string().email().required().messages({
            'any.required': 'Customer email is required when creating a new customer.',
            'string.email': 'Customer email must be a valid email address.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    customerPhone: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.string().optional().allow('', null).messages({
            'string.base': 'Customer phone must be a string.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    customerCompanyName: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.string().max(100).optional().messages({
            'string.max': 'Customer company name cannot exceed 100 characters.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    // Make address optional for new customer (only name, email, phone required per request)
    customerAddress: joi_1.default.string().when('isNewCustomer', {
        is: true,
        then: joi_1.default.string().min(5).max(255).optional().messages({
            'string.min': 'Customer address must be at least 5 characters long.',
            'string.max': 'Customer address cannot exceed 255 characters.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    // jobTitle and jobDescription removed per client change
    assignedTo: joi_1.default.string().optional(),
    jobDate: joi_1.default.date().optional(),
    jobType: joi_1.default.number().valid(1, 2).optional().default(1), // 1: one-time, 2: recurring
    frequencyValue: joi_1.default.number().when('jobType', {
        is: 2,
        then: joi_1.default.number().min(1).required().messages({
            'any.required': 'Frequency value is required for recurring jobs.',
            'number.min': 'Frequency value must be at least 1.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    frequencyUnit: joi_1.default.number().when('jobType', {
        is: 2,
        then: joi_1.default.number().valid(1, 2, 3, 4).required().messages({
            'any.required': 'Frequency unit is required for recurring jobs.',
            'any.only': 'Invalid frequency unit.',
        }),
        otherwise: joi_1.default.forbidden(),
    }),
    amount: joi_1.default.number().min(0).default(0).messages({
        'number.min': 'Amount cannot be negative.',
    }),
    paymentType: joi_1.default.number().valid(1, 2, 3, 4, 5).optional(), // 1: bank_transfer, 2: cash, 3: card, 4: cheque, 5: other
    invoiceEmails: joi_1.default.array().items(joi_1.default.string().email()).optional().messages({
        'array.items': 'All invoice emails must be valid email addresses.',
    }),
    jobAddress: joi_1.default.string().optional(),
    // useDifferentBankAccount and bankAccountId removed per client change
    items: joi_1.default.array().items(jobItemSchema).default([]),
    notes: joi_1.default.string().allow('', null).optional(),
    status: joi_1.default.number().valid(1, 2, 3, 4).optional().default(1),
});
exports.updateJobSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    quotationId: joi_1.default.string().optional(),
    customerId: joi_1.default.string().optional(),
    // jobTitle and jobDescription removed per client change
    assignedTo: joi_1.default.string().optional(),
    jobDate: joi_1.default.date().optional(),
    jobType: joi_1.default.number().valid(1, 2).optional(),
    jobAddress: joi_1.default.string().optional(),
    frequencyValue: joi_1.default.number().when('jobType', {
        is: 2,
        then: joi_1.default.number().min(1).required().messages({
            'any.required': 'Frequency value is required for recurring jobs.',
            'number.min': 'Frequency value must be at least 1.',
        }),
        otherwise: joi_1.default.optional(),
    }),
    frequencyUnit: joi_1.default.number().when('jobType', {
        is: 2,
        then: joi_1.default.number().valid(1, 2, 3, 4).required().messages({
            'any.required': 'Frequency unit is required for recurring jobs.',
            'any.only': 'Invalid frequency unit.',
        }),
        otherwise: joi_1.default.optional(),
    }),
    amount: joi_1.default.number().min(0).optional().messages({
        'number.min': 'Amount cannot be negative.',
    }),
    paymentType: joi_1.default.number().valid(1, 2, 3, 4, 5).optional(),
    invoiceEmails: joi_1.default.array().items(joi_1.default.string().email()).optional().messages({
        'array.items': 'All invoice emails must be valid email addresses.',
    }),
    // useDifferentBankAccount and bankAccountId removed per client change
    items: joi_1.default.array().items(jobItemSchema).optional(),
    notes: joi_1.default.string().allow('', null).optional(),
    status: joi_1.default.number().valid(1, 2, 3, 4).optional(),
});
//# sourceMappingURL=job.validator.js.map