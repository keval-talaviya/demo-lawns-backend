"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimiterConfig = void 0;
exports.defaultRateLimiterConfig = {
    global: {
        windowMs: 60_000,
        max: 100,
    },
    modules: {
        auth: {
            windowMs: 15 * 60_000,
            max: 20,
            message: 'Too many auth attempts, please try again later.',
        },
        user: {
            windowMs: 60_000,
            max: 120,
        },
        'user-mobile': {
            windowMs: 60_000,
            max: 60,
        },
        'user-web': {
            windowMs: 60_000,
            max: 100,
        },
    },
};
//# sourceMappingURL=rateLimiterConfig.js.map