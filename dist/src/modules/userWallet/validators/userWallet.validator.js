"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWalletValidator = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userWalletValidator = {
    createTransaction: joi_1.default.object({
        userId: joi_1.default.string().required().trim(),
        type: joi_1.default.number().valid(1, 2).required(), // 1: Withdraw, 2: Deposit
        amount: joi_1.default.number().min(0.01).required(),
        purpose: joi_1.default.string().required().trim().min(1).max(500),
        date: joi_1.default.date().optional(),
    }),
};
//# sourceMappingURL=userWallet.validator.js.map