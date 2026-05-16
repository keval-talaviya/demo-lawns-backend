"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const userSchema = new mongoose_1.Schema({
    uniqueCode: { type: String, unique: true, sparse: true },
    isFranchise: { type: Boolean, default: false },
    address: { type: String, default: null },
    email: { type: String, default: null },
    parentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    accountNumber: { type: String, defult: null },
    // User fields,
    role: {
        type: Number,
        enum: [1, 2, 3], // 1: master_admin, 2: franchise_admin, 3: staff
        default: 3,
        required: true,
    },
    name: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, default: null },
    countryCode: { type: Number, default: null },
    balance: { type: Number, default: 0 },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    // Common fields
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
/**
 * Hash password before save
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcrypt_1.default.genSalt(10);
        this.password = await bcrypt_1.default.hash(this.password, salt);
        return next();
    }
    catch (err) {
        return next(err);
    }
});
exports.UserModel = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user.model.js.map