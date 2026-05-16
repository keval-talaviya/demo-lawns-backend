"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAllStaffSchema = exports.listStaffSchema = exports.updateStaffSchema = exports.createStaffSchema = exports.updateSchema = exports.createUserSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    roles: joi_1.default.array().items(joi_1.default.string()),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
exports.createUserSchema = joi_1.default.object({
    isFranchise: joi_1.default.boolean(),
    franchiseCode: joi_1.default.string(),
    franchiseName: joi_1.default.string(),
    address: joi_1.default.string(),
    phone: joi_1.default.string(),
    email: joi_1.default.string().email(),
    accountNumber: joi_1.default.string().optional(),
    parentId: joi_1.default.string(),
    parentFranchiseId: joi_1.default.string(), // Supporting both names for backward/UI compatibility
    role: joi_1.default.number().valid(1, 2, 3),
    name: joi_1.default.string(),
    username: joi_1.default.string(),
    userEmail: joi_1.default.string().email(),
    password: joi_1.default.string().min(6),
    phoneNumber: joi_1.default.string(),
    permissions: joi_1.default.array().items(joi_1.default.string()),
    status: joi_1.default.number().valid(1, 2),
});
exports.updateSchema = joi_1.default.object({
    isFranchise: joi_1.default.boolean(),
    franchiseCode: joi_1.default.string(),
    franchiseName: joi_1.default.string(),
    address: joi_1.default.string(),
    phone: joi_1.default.string(),
    email: joi_1.default.string().email(),
    parentId: joi_1.default.string(),
    parentFranchiseId: joi_1.default.string(), // Supporting both names for backward/UI compatibility
    accountNumber: joi_1.default.string().optional(),
    role: joi_1.default.number().valid(1, 2, 3),
    name: joi_1.default.string().min(2).max(50),
    username: joi_1.default.string(),
    userEmail: joi_1.default.string().email(),
    password: joi_1.default.string().min(6).allow(null, ''),
    phoneNumber: joi_1.default.string(),
    permissions: joi_1.default.array().items(joi_1.default.string()),
    status: joi_1.default.number().valid(1, 2),
    isActive: joi_1.default.boolean(),
});
// ===== STAFF MANAGEMENT SCHEMAS =====
exports.createStaffSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().required(),
    name: joi_1.default.string().min(2).max(100).required().messages({
        'any.required': 'Staff name is required.',
        'string.min': 'Staff name must be at least 2 characters.',
        'string.max': 'Staff name cannot exceed 100 characters.',
    }),
    email: joi_1.default.string().email().required().messages({
        'any.required': 'Email is required.',
        'string.email': 'Email must be a valid email address.',
    }),
    phoneNumber: joi_1.default.string().optional().messages({
        'string.pattern.base': 'Phone number must be valid.',
    }),
    password: joi_1.default.string().min(6).required().messages({
        'any.required': 'Password is required.',
        'string.min': 'Password must be at least 6 characters.',
    }),
    permissions: joi_1.default.array().items(joi_1.default.string()).optional().messages({
        'array.items': 'Permissions must be an array of strings.',
    }),
    isActive: joi_1.default.boolean().default(true),
    address: joi_1.default.string().max(255).optional(),
    countryCode: joi_1.default.number().optional(),
});
exports.updateStaffSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(100).optional(),
    email: joi_1.default.string().email().optional(),
    phoneNumber: joi_1.default.string().optional(),
    password: joi_1.default.string().min(6).optional().allow(null, ''),
    permissions: joi_1.default.array().items(joi_1.default.string()).optional(),
    isActive: joi_1.default.boolean().optional(),
    address: joi_1.default.string().max(255).optional(),
    countryCode: joi_1.default.number().optional(),
    parentId: joi_1.default.string().optional(),
    franchiseId: joi_1.default.string().optional(), // UI consistency
});
exports.listStaffSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(25),
    search: joi_1.default.string().empty('').optional(),
    isActive: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string().optional(),
});
// List all staff (no pagination)
exports.listAllStaffSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().optional(),
    search: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional(),
    sortBy: joi_1.default.string().optional(),
});
//# sourceMappingURL=user.validator.js.map