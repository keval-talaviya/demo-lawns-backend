"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFranchiseSchema = exports.createFranchiseSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.createFranchiseSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    address: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
    city: joi_1.default.string().required(),
    state: joi_1.default.string().required(),
    postalCode: joi_1.default.string().required(),
    countryCode: joi_1.default.number().required(),
    country: joi_1.default.string().required(),
    phone: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    isActive: joi_1.default.boolean().default(true),
});
exports.updateFranchiseSchema = joi_1.default.object({
    name: joi_1.default.string().allow('', null),
    address: joi_1.default.string().allow('', null),
    city: joi_1.default.string().allow('', null),
    state: joi_1.default.string().allow('', null),
    postalCode: joi_1.default.string().allow('', null),
    countryCode: joi_1.default.number(),
    country: joi_1.default.string().allow('', null),
    phone: joi_1.default.string().allow('', null),
    email: joi_1.default.string().email().allow('', null),
    isActive: joi_1.default.boolean()
});
//# sourceMappingURL=franchise.validator.js.map