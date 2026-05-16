"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleStatsSchema = exports.dayViewSchema = exports.weekViewSchema = exports.monthViewSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.monthViewSchema = joi_1.default.object({
    query: joi_1.default.object({
        year: joi_1.default.number().integer().min(2000).max(2100).required(),
        month: joi_1.default.number().integer().min(1).max(12).required(),
        franchiseId: joi_1.default.string().optional(),
        status: joi_1.default.number().optional(),
        assignedTo: joi_1.default.string().optional(),
    }),
});
exports.weekViewSchema = joi_1.default.object({
    query: joi_1.default.object({
        startDate: joi_1.default.date().iso().required(),
        endDate: joi_1.default.date().iso().required(),
        franchiseId: joi_1.default.string().optional(),
        status: joi_1.default.number().optional(),
        assignedTo: joi_1.default.string().optional(),
    }),
});
exports.dayViewSchema = joi_1.default.object({
    query: joi_1.default.object({
        date: joi_1.default.date().iso().required(),
        franchiseId: joi_1.default.string().optional(),
        status: joi_1.default.number().optional(),
        assignedTo: joi_1.default.string().optional(),
    }),
});
exports.scheduleStatsSchema = joi_1.default.object({
    query: joi_1.default.object({
        startDate: joi_1.default.date().iso().required(),
        endDate: joi_1.default.date().iso().required(),
        franchiseId: joi_1.default.string().optional(),
    }),
});
//# sourceMappingURL=jobSchedule.validator.js.map