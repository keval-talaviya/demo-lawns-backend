import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Item name is required.',
  }),
  description: Joi.string().optional().allow('').max(500).messages({
    'string.max': 'Item description cannot exceed 500 characters.',
  }),
  quantity: Joi.number().required().min(1).messages({
    'any.required': 'Item quantity is required.',
    'number.min': 'Item quantity must be at least 1.',
  }),
  unitPrice: Joi.number().required().min(0).messages({
    'any.required': 'Item unit price is required.',
    'number.min': 'Item unit price cannot be negative.',
  }),
  price: Joi.number().required().min(0).messages({
    'any.required': 'Item price is required.',
    'number.min': 'Item price cannot be negative.',
  }),
});

export const createInvoiceSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  invoiceNumber: Joi.string().optional(),
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required.',
  }),
  jobId: Joi.string().optional(),
  items: Joi.array().items(invoiceItemSchema).min(1).required().messages({
    'any.required': 'At least one item is required.',
    'array.min': 'At least one item is required.',
  }),
  tax: Joi.number().min(0).default(0).messages({
    'number.min': 'Tax cannot be negative.',
  }),
  paidAmount: Joi.number().min(0).default(0).messages({
    'number.min': 'Paid amount cannot be negative.',
  }),
  issuedDate: Joi.date().optional(),
  status: Joi.number().valid(1, 2, 3).optional().default(1), // 1: unpaid, 2: partial, 3: paid
});

export const updateInvoiceSchema = Joi.object({
  invoiceNumber: Joi.string().optional(),
  customerId: Joi.string().optional(),
  jobId: Joi.string().optional(),
  items: Joi.array().items(invoiceItemSchema).optional(),
  tax: Joi.number().min(0).optional().messages({
    'number.min': 'Tax cannot be negative.',
  }),
  paidAmount: Joi.number().min(0).optional().messages({
    'number.min': 'Paid amount cannot be negative.',
  }),
  issuedDate: Joi.date().optional(),
  status: Joi.number().valid(1, 2, 3).optional(),
});

export const updatePaymentSchema = Joi.object({
  paidAmount: Joi.number().required().min(0).messages({
    'any.required': 'Paid amount is required.',
    'number.min': 'Paid amount cannot be negative.',
  }),
});
