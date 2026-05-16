import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roles: Joi.array().items(Joi.string()),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const createUserSchema = Joi.object({
  isFranchise: Joi.boolean(),
  franchiseCode: Joi.string(),
  franchiseName: Joi.string(),
  address: Joi.string(),
  phone: Joi.string(),
  email: Joi.string().email(),
  accountNumber: Joi.string().optional(),
  parentId: Joi.string(),
  parentFranchiseId: Joi.string(), // Supporting both names for backward/UI compatibility
  role: Joi.number().valid(1, 2, 3),
  name: Joi.string(),
  username: Joi.string(),
  userEmail: Joi.string().email(),
  password: Joi.string().min(6),
  phoneNumber: Joi.string(),
  permissions: Joi.array().items(Joi.string()),
  status: Joi.number().valid(1, 2),
});

export const updateSchema = Joi.object({
  isFranchise: Joi.boolean(),
  franchiseCode: Joi.string(),
  franchiseName: Joi.string(),
  address: Joi.string(),
  phone: Joi.string(),
  email: Joi.string().email(),
  parentId: Joi.string(),
  parentFranchiseId: Joi.string(), // Supporting both names for backward/UI compatibility
  accountNumber: Joi.string().optional(),
  role: Joi.number().valid(1, 2, 3),
  name: Joi.string().min(2).max(50),
  username: Joi.string(),
  userEmail: Joi.string().email(),
  password: Joi.string().min(6).allow(null, ''),
  phoneNumber: Joi.string(),
  permissions: Joi.array().items(Joi.string()),
  status: Joi.number().valid(1, 2),
  isActive: Joi.boolean(),
});

// ===== STAFF MANAGEMENT SCHEMAS =====
export const createStaffSchema = Joi.object({
  franchiseId: Joi.string().required(),
  name: Joi.string().min(2).max(100).required().messages({
    'any.required': 'Staff name is required.',
    'string.min': 'Staff name must be at least 2 characters.',
    'string.max': 'Staff name cannot exceed 100 characters.',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required.',
    'string.email': 'Email must be a valid email address.',
  }),
  phoneNumber: Joi.string().optional().messages({
    'string.pattern.base': 'Phone number must be valid.',
  }),
  password: Joi.string().min(6).required().messages({
    'any.required': 'Password is required.',
    'string.min': 'Password must be at least 6 characters.',
  }),
  permissions: Joi.array().items(Joi.string()).optional().messages({
    'array.items': 'Permissions must be an array of strings.',
  }),
  isActive: Joi.boolean().default(true),
  address: Joi.string().max(255).optional(),
  countryCode: Joi.number().optional(),
});

export const updateStaffSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().optional(),
  password: Joi.string().min(6).optional().allow(null, ''),
  permissions: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
  address: Joi.string().max(255).optional(),
  countryCode: Joi.number().optional(),
  parentId: Joi.string().optional(),
  franchiseId: Joi.string().optional(), // UI consistency
});

export const listStaffSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(25),
  search: Joi.string().empty('').optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().optional(),
});

// List all staff (no pagination)
export const listAllStaffSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  search: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().optional(),
});
