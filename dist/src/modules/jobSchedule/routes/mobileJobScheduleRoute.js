"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use((0, rateLimiter_1.getModuleRateLimiter)('jobSchedule-mobile'));
exports.default = router;
//# sourceMappingURL=mobileJobScheduleRoute.js.map