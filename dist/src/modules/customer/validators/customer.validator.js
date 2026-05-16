"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransactionSchema = exports.updateCustomerSchema = exports.createCustomerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createCustomerSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().allow(null).optional(),
    name: joi_1.default.string().required(),
    companyName: joi_1.default.string().allow('', null).optional(),
    phone: joi_1.default.string().allow('', null).optional(),
    email: joi_1.default.string().email().allow('', null).optional(),
    address: joi_1.default.string().allow('', null).optional(),
    postalCode: joi_1.default.string().allow('', null).optional(),
    city: joi_1.default.string().allow('', null).optional(),
    state: joi_1.default.string().allow('', null).optional(),
    country: joi_1.default.string().allow('', null).optional(),
    isActive: joi_1.default.boolean().default(true)
});
exports.updateCustomerSchema = joi_1.default.object({
    franchiseId: joi_1.default.string().allow(null).optional(),
    name: joi_1.default.string().optional(),
    companyName: joi_1.default.string().allow('', null).optional(),
    phone: joi_1.default.string().allow('', null).optional(),
    email: joi_1.default.string().email().allow('', null).optional(),
    address: joi_1.default.string().allow('', null).optional(),
    postalCode: joi_1.default.string().allow('', null).optional(),
    city: joi_1.default.string().allow('', null).optional(),
    state: joi_1.default.string().allow('', null).optional(),
    country: joi_1.default.string().allow('', null).optional(),
    isActive: joi_1.default.boolean().optional()
});
exports.createTransactionSchema = joi_1.default.object({
    amount: joi_1.default.number().required(),
    type: joi_1.default.number().valid(1, 2).required(), // 1: Withdraw, 2: Deposit
    purpose: joi_1.default.string().required(),
    date: joi_1.default.date().required()
});
//# sourceMappingURL=customer.validator.js.map