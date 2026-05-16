"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const auth_validator_1 = require("../validators/auth.validator");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
const authLimiter = (0, rateLimiter_1.getCustomRateLimiter)({
    windowMs: 15 * 60_000,
    max: 10,
    message: 'Too many auth attempts, please try again later.',
});
router.use((0, rateLimiter_1.getModuleRateLimiter)('auth'));
router.post('/register', authLimiter, (0, validatorMiddleware_1.validatorMiddleware)(auth_validator_1.registerSchema), auth_controller_1.AuthController.register);
router.post('/login', authLimiter, (0, validatorMiddleware_1.validatorMiddleware)(auth_validator_1.loginSchema), auth_controller_1.AuthController.login);
//franchise login 
router.post('/franchise/login', authLimiter, (0, validatorMiddleware_1.validatorMiddleware)(auth_validator_1.loginSchema), auth_controller_1.AuthController.franchiseLogin);
exports.default = router;
//# sourceMappingURL=auth.route.js.map