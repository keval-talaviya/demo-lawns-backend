"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = require("../config");
const response_1 = require("../common/response");
const messages_1 = require("../common/messages");
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED);
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.accessSecret);
        if (typeof payload === 'string') {
            throw new Error('Invalid token payload');
        }
        req.user = payload;
        return next();
    }
    catch (error) {
        return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, messages_1.GLOBAL_MESSAGES.UNAUTHORIZED, {
            error,
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=authMiddleware.js.map