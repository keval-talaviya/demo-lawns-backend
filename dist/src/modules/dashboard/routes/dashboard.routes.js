"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/dashboard/routes/dashboard.routes.ts
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, rateLimiter_1.getModuleRateLimiter)('dashboard'));
router.get('/', dashboard_controller_1.DashboardController.getDashboard);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map