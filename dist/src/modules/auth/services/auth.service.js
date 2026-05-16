"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../../../config");
const user_service_1 = require("../../user/services/user.service");
const constants_1 = require("../../../common/constants");
const franchise_service_1 = require("../../franchise/services/franchise.service");
class AuthServiceClass {
    issueToken(userOrPayload) {
        // Build canonical payload from either a Mongoose document or a plain payload
        const id = 
        // prefer the string id property if available, otherwise try _id, otherwise empty string
        userOrPayload.id ?? (userOrPayload._id ? String(userOrPayload._id) : '');
        const email = userOrPayload.userEmail ?? userOrPayload.email ?? '';
        const role = userOrPayload.role ?? constants_1.ROLES.FRANCHISE_ADMIN ?? 3; // default if needed
        const payload = { id, email, role };
        const accessSecret = String(config_1.config.jwt.accessSecret || 'access_secret');
        const accessExpiry = String(config_1.config.jwt.accessExpiry || '15m');
        const accessToken = jsonwebtoken_1.default.sign(payload, accessSecret, {
            expiresIn: accessExpiry,
        });
        return accessToken;
    }
    /**
     * Public register:
     * - Disallow creating MASTER_ADMIN or FRANCHISE via this route.
     */
    async register(payload) {
        // Prevent privileged role creation via public route
        if (payload.role === constants_1.ROLES.MASTER_ADMIN) {
            throw new Error('Cannot create Master Admin via public register');
        }
        if (payload.role === constants_1.ROLES.FRANCHISE_ADMIN || payload.isFranchise) {
            throw new Error('Franchise must be created by Master Admin');
        }
        // Normalize legacy parent field
        if (payload.parentFranchiseId && !payload.parentId) {
            payload.parentId = payload.parentFranchiseId;
            delete payload.parentFranchiseId;
        }
        const user = await user_service_1.UserService.createUser(payload);
        const accessToken = this.issueToken(user);
        return {
            user: user_service_1.UserService.sanitize(user),
            accessToken,
        };
    }
    /**
     * Admin-only: create a franchise (caller must be MASTER_ADMIN).
     * Returns created franchise + accessToken.
     */
    async adminCreateFranchise(payload, caller) {
        if (!caller || caller.role !== constants_1.ROLES.MASTER_ADMIN) {
            throw new Error('Only Master Admin can create franchise accounts');
        }
        // Force franchise role and mark as franchise
        payload.role = constants_1.ROLES.FRANCHISE_ADMIN;
        payload.isFranchise = true;
        // Optionally set parentId to caller (master admin) or null
        if (!payload.parentId) {
            payload.parentId = String(caller._id);
        }
        // Normalize legacy parent field
        if (payload.parentFranchiseId && !payload.parentId) {
            payload.parentId = payload.parentFranchiseId;
            delete payload.parentFranchiseId;
        }
        const franchise = await user_service_1.UserService.createUser(payload);
        const accessToken = this.issueToken(franchise);
        return {
            user: user_service_1.UserService.sanitize(franchise),
            accessToken,
        };
    }
    /**
     * Login: accepts email (userEmail or legacy email) and password.
     */
    async login({ email, password }) {
        const user = await user_service_1.UserService.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await user_service_1.UserService.comparePassword(user, password);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const accessToken = this.issueToken(user);
        return {
            user: user_service_1.UserService.sanitize(user),
            accessToken,
        };
    }
    async franchiseLogin({ email, password }) {
        const franchise = await franchise_service_1.FranchiseService.findByMail(email);
        if (!franchise)
            throw new Error('Invalid credentials');
        const isValid = await bcrypt_1.default.compare(password, String(franchise.password));
        if (!isValid)
            throw new Error('Invalid credentials');
        const accessToken = this.issueToken({
            id: String(franchise._id),
            email: franchise.email,
            role: constants_1.ROLES.FRANCHISE_ADMIN,
        });
        const sanitizedUser = franchise_service_1.FranchiseService.sanitize(franchise);
        return {
            success: true,
            message: 'Login successful.',
            data: {
                user: sanitizedUser,
                accessToken,
            },
        };
    }
}
exports.AuthService = new AuthServiceClass();
//# sourceMappingURL=auth.service.js.map