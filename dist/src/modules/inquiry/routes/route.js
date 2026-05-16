"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inquiry_controller_1 = require("../controllers/inquiry.controller");
const router = (0, express_1.Router)();
// Public endpoint to receive inquiry form submissions
router.post('/', inquiry_controller_1.sendInquiry);
exports.default = router;
//# sourceMappingURL=route.js.map