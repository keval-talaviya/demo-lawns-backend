"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomRateLimiter = exports.getModuleRateLimiter = exports.defaultRateLimiter = exports.createRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("../config");
const rateLimiterConfig_1 = require("../config/rateLimiterConfig");
let RedisStore;
let redisClient;
// Try to load Redis store if available (optional dependency)
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RedisStore = require('rate-limit-redis');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require('redis');
    if (config_1.config.redisUrl) {
        redisClient = createClient({ url: config_1.config.redisUrl });
        redisClient.on('error', (err) => {
            // eslint-disable-next-line no-console
            console.error('Redis error', err);
        });
        void redisClient.connect();
    }
}
catch (error) {
    // Redis store not available, will use in-memory store
    // eslint-disable-next-line no-console
    console.warn('Redis store not available, using in-memory rate limiting');
}
const buildStore = () => {
    if (!redisClient || !RedisStore) {
        return undefined;
    }
    try {
        return new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
        });
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to create Redis store, using in-memory rate limiting', error);
        return undefined;
    }
};
const createRateLimiter = (options) => (0, express_rate_limit_1.default)({
    store: buildStore(),
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
});
exports.createRateLimiter = createRateLimiter;
exports.defaultRateLimiter = (0, exports.createRateLimiter)({
    ...rateLimiterConfig_1.defaultRateLimiterConfig.global,
    windowMs: config_1.config.rateLimiter.windowMs,
    max: config_1.config.rateLimiter.max,
});
const getModuleRateLimiter = (moduleKey) => {
    const moduleConfig = rateLimiterConfig_1.defaultRateLimiterConfig.modules[moduleKey];
    if (!moduleConfig) {
        return exports.defaultRateLimiter;
    }
    return (0, exports.createRateLimiter)(moduleConfig);
};
exports.getModuleRateLimiter = getModuleRateLimiter;
const getCustomRateLimiter = (options) => (0, exports.createRateLimiter)(options);
exports.getCustomRateLimiter = getCustomRateLimiter;
//# sourceMappingURL=rateLimiter.js.map