import Joi from 'joi';

const jobItemSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Item name is required.',
  }),
  description: Joi.string().allow('', null).optional(),
  quantity: Joi.number().min(1).default(1).messages({
    'number.min': 'Quantity must be at least 1.',
  }),
  unitPrice: Joi.number().min(0).default(0).messages({
    'number.min': 'Unit price cannot be negative.',
  }),
  price: Joi.number().min(0).default(0).messages({
    'number.min': 'Price cannot be negative.',
  }),
});

export const createJobSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  quotationId: Joi.string().optional(),
  customerId: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.forbidden().messages({
      'any.unknown': 'Customer ID should not be provided when creating a new customer.',
    }),
    otherwise: Joi.required().messages({
      'any.required': 'Customer ID is required.',
    }),
  }),
  isNewCustomer: Joi.boolean().default(false),
  customerName: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.string().required().min(2).max(100).messages({
      'any.required': 'Customer name is required when creating a new customer.',
      'string.min': 'Customer name must be at least 2 characters long.',
      'string.max': 'Customer name cannot exceed 100 characters.',
    }),
    otherwise: Joi.forbidden(),
  }),
  customerEmail: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.string().email().required().messages({
      'any.required': 'Customer email is required when creating a new customer.',
      'string.email': 'Customer email must be a valid email address.',
    }),
    otherwise: Joi.forbidden(),
  }),
  customerPhone: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.string().optional().allow('', null).messages({
      'string.base': 'Customer phone must be a string.',
    }),
    otherwise: Joi.forbidden(),
  }),
  customerCompanyName: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.string().max(100).optional().messages({
      'string.max': 'Customer company name cannot exceed 100 characters.',
    }),
    otherwise: Joi.forbidden(),
  }),
  // Make address optional for new customer (only name, email, phone required per request)
  customerAddress: Joi.string().when('isNewCustomer', {
    is: true,
    then: Joi.string().min(5).max(255).optional().messages({
      'string.min': 'Customer address must be at least 5 characters long.',
      'string.max': 'Customer address cannot exceed 255 characters.',
    }),
    otherwise: Joi.forbidden(),
  }),
  // jobTitle and jobDescription removed per client change
  assignedTo: Joi.string().optional(),
  jobDate: Joi.date().optional(),
  jobType: Joi.number().valid(1, 2).optional().default(1), // 1: one-time, 2: recurring
  frequencyValue: Joi.number().when('jobType', {
    is: 2,
    then: Joi.number().min(1).required().messages({
      'any.required': 'Frequency value is required for recurring jobs.',
      'number.min': 'Frequency value must be at least 1.',
    }),
    otherwise: Joi.forbidden(),
  }),
  frequencyUnit: Joi.number().when('jobType', {
    is: 2,
    then: Joi.number().valid(1, 2, 3, 4).required().messages({
      'any.required': 'Frequency unit is required for recurring jobs.',
      'any.only': 'Invalid frequency unit.',
    }),
    otherwise: Joi.forbidden(),
  }),
  amount: Joi.number().min(0).default(0).messages({
    'number.min': 'Amount cannot be negative.',
  }),
  paymentType: Joi.number().valid(1, 2, 3, 4, 5).optional(), // 1: bank_transfer, 2: cash, 3: card, 4: cheque, 5: other
  invoiceEmails: Joi.array().items(Joi.string().email()).optional().messages({
    'array.items': 'All invoice emails must be valid email addresses.',
  }),
  jobAddress: Joi.string().optional(),
  // useDifferentBankAccount and bankAccountId removed per client change
  items: Joi.array().items(jobItemSchema).default([]),
  notes: Joi.string().allow('', null).optional(),
  status: Joi.number().valid(1, 2, 3, 4).optional().default(1),
});

export const updateJobSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  quotationId: Joi.string().optional(),
  customerId: Joi.string().optional(),
  // jobTitle and jobDescription removed per client change
  assignedTo: Joi.string().optional(),
  jobDate: Joi.date().optional(),
  jobType: Joi.number().valid(1, 2).optional(),
  jobAddress: Joi.string().optional(),

  frequencyValue: Joi.number().when('jobType', {
    is: 2,
    then: Joi.number().min(1).required().messages({
      'any.required': 'Frequency value is required for recurring jobs.',
      'number.min': 'Frequency value must be at least 1.',
    }),
    otherwise: Joi.optional(),
  }),
  frequencyUnit: Joi.number().when('jobType', {
    is: 2,
    then: Joi.number().valid(1, 2, 3, 4).required().messages({
      'any.required': 'Frequency unit is required for recurring jobs.',
      'any.only': 'Invalid frequency unit.',
    }),
    otherwise: Joi.optional(),
  }),
  amount: Joi.number().min(0).optional().messages({
    'number.min': 'Amount cannot be negative.',
  }),
  paymentType: Joi.number().valid(1, 2, 3, 4, 5).optional(),
  invoiceEmails: Joi.array().items(Joi.string().email()).optional().messages({
    'array.items': 'All invoice emails must be valid email addresses.',
  }),
  // useDifferentBankAccount and bankAccountId removed per client change
  items: Joi.array().items(jobItemSchema).optional(),
  notes: Joi.string().allow('', null).optional(),
  status: Joi.number().valid(1, 2, 3, 4).optional(),
});
