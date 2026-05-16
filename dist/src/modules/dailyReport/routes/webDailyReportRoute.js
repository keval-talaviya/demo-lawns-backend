"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../../../common/rateLimiter");
const webDailyReport_controller_1 = require("../controllers/webDailyReport.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.use((0, rateLimiter_1.getModuleRateLimiter)('dailyReport-web'));
router.use(authMiddleware_1.authenticate);
router.get('/work-report', webDailyReport_controller_1.WebDailyReportController.getWorkReport);
exports.default = router;
//# sourceMappingURL=webDailyReportRoute.js.map