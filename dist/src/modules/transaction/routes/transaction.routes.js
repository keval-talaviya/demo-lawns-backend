"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const router = (0, express_1.Router)();
router.post('/', authMiddleware_1.authenticate, transaction_controller_1.TransactionController.create);
router.post('/list', authMiddleware_1.authenticate, transaction_controller_1.TransactionController.list);
router.get('/getByCustomerId', authMiddleware_1.authenticate, transaction_controller_1.TransactionController.getByCustomerId);
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map