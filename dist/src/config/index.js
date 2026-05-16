"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/express_starter',
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    rateLimiter: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
        max: Number(process.env.RATE_LIMIT_MAX) || 100,
    },
    redisUrl: process.env.REDIS_URL,
    fileUploadPath: process.env.FILE_UPLOAD_PATH || 'uploads',
    apiUrl: process.env.API_URL || 'http://localhost:3000',
};
//# sourceMappingURL=index.js.map