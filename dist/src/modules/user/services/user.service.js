"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const base_dao_1 = require("../../../db/base.dao");
const user_model_1 = require("../model/user.model");
const serialNumber_service_1 = require("../../../common/serialNumber.service");
class UserServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(user_model_1.UserModel);
    }
    async createUser(payload) {
        const emailToCheck = payload.email;
        if (emailToCheck) {
            const existing = await user_model_1.UserModel.findOne({ email: emailToCheck }).lean();
            if (existing) {
                throw new Error('Email already in use');
            }
        }
        const uniqueCode = await serialNumber_service_1.SerialNumberService.generateUniqueCode({
            prefix: 'USR-',
            padding: 4,
            model: user_model_1.UserModel,
        });
        const createdUser = await user_model_1.UserModel.create({
            ...payload,
            role: payload.role ?? 2,
            uniqueCode,
        });
        return createdUser;
    }
    async updateUser(id, payload) {
        const updatePayload = { ...payload };
        if (payload.password) {
            updatePayload.password = await bcrypt_1.default.hash(payload.password, 10);
        }
        return this.updateById(id, updatePayload);
    }
    async findByEmail(email) {
        return this.findOne({
            $or: [{ email }, { userEmail: email }],
        });
    }
    async comparePassword(user, password) {
        if (!user.password) {
            return false;
        }
        return bcrypt_1.default.compare(password, user.password);
    }
    sanitize(user) {
        const json = user.toObject();
        const { password, ...sanitized } = json;
        return sanitized;
    }
}
exports.UserService = new UserServiceClass();
//# sourceMappingURL=user.service.js.map