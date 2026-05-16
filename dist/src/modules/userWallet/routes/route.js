"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userWallet_controller_1 = require("../controllers/userWallet.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const userWallet_validator_1 = require("../validators/userWallet.validator");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
/**
 * @route   GET /api/user-wallet/cash-report
 * @desc    Get cash report - all users with balances
 * @access  Master Admin, Franchise Admin
 */
router.get('/cash-report', userWallet_controller_1.UserWalletController.getCashReport);
/**
 * @route   GET /api/user-wallet
 * @desc    Get user wallet details (balance + transactions)
 * @access  Authenticated users (staff can only view own)
 */
router.get('/', userWallet_controller_1.UserWalletController.getUserWallet);
/**
 * @route   POST /api/user-wallet/transaction
 * @desc    Create manual transaction (deposit/withdraw)
 * @access  Master Admin, Franchise Admin
 */
router.post('/transaction', (0, validatorMiddleware_1.validatorMiddleware)(userWallet_validator_1.userWalletValidator.createTransaction), userWallet_controller_1.UserWalletController.createTransaction);
/**
 * @route   DELETE /api/user-wallet/transaction/:id
 * @desc    Delete transaction
 * @access  Master Admin, Franchise Admin
 */
router.delete('/transaction/:id', userWallet_controller_1.UserWalletController.deleteTransaction);
exports.default = router;
//# sourceMappingURL=route.js.map