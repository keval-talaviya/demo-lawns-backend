"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mobileUser_controller_1 = require("../controllers/mobileUser.controller");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const user_validator_1 = require("../validators/user.validator");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use((0, rateLimiter_1.getModuleRateLimiter)('user-mobile'));
const authLimiter = (0, rateLimiter_1.getCustomRateLimiter)({
    windowMs: 15 * 60_000,
    max: 10,
    message: 'Too many login attempts. Please try again later.',
});
router.post('/register', (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.registerSchema), mobileUser_controller_1.MobileUserController.register);
router.post('/login', authLimiter, (0, validatorMiddleware_1.validatorMiddleware)(user_validator_1.loginSchema), mobileUser_controller_1.MobileUserController.login);
exports.default = router;
//# sourceMappingURL=mobileUserRoute.js.map