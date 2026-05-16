"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.companySettingsValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.companySettingsValidator = {
    create: joi_1.default.object({
        companyName: joi_1.default.string().required().trim().min(1).max(200),
        gstNumber: joi_1.default.string().required().trim(),
        gstRate: joi_1.default.number().required().min(0).max(100),
    }),
    update: joi_1.default.object({
        companyName: joi_1.default.string().optional().trim().min(1).max(200),
        gstNumber: joi_1.default.string().optional().trim(),
        gstRate: joi_1.default.number().optional().min(0).max(100),
    }),
};
//# sourceMappingURL=companySettings.validator.js.map