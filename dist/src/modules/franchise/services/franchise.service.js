"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FranchiseService = void 0;
const base_dao_1 = require("../../../db/base.dao");
const franchise_model_1 = require("../model/franchise.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const serialNumber_service_1 = require("../../../common/serialNumber.service");
class FranchiseServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(franchise_model_1.FranchiseModel);
    }
    async findByMail(email) {
        return this.findOne({ email });
    }
    sanitize(franchise) {
        if (!franchise)
            return null;
        // Convert to plain object safely
        const obj = typeof franchise.toObject === 'function'
            ? franchise.toObject()
            : { ...franchise };
        // Remove sensitive fields
        delete obj.password;
        delete obj.__v;
        delete obj.isDeleted;
        delete obj.deletedAt;
        return obj;
    }
    async createFranchise(payload) {
        // Generate unique code: FR-0001
        const uniqueCode = await serialNumber_service_1.SerialNumberService.generateUniqueCode({
            prefix: 'FR-',
            padding: 4,
            model: franchise_model_1.FranchiseModel,
        });
        if (payload.password) {
            payload.password = await bcrypt_1.default.hash(payload.password, 10);
        }
        return this.create({
            ...payload,
            uniqueCode,
        });
    }
    async updateFranchise(id, payload) {
        return this.updateById(id, payload);
    }
}
exports.FranchiseService = new FranchiseServiceClass();
//# sourceMappingURL=franchise.service.js.map