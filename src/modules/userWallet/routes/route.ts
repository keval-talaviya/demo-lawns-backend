import { Router } from 'express';
import { UserWalletController } from '../controllers/userWallet.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { userWalletValidator } from '../validators/userWallet.validator';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/user-wallet/cash-report
 * @desc    Get cash report - all users with balances
 * @access  Master Admin, Franchise Admin
 */
router.get('/cash-report', UserWalletController.getCashReport);

/**
 * @route   GET /api/user-wallet
 * @desc    Get user wallet details (balance + transactions)
 * @access  Authenticated users (staff can only view own)
 */
router.get('/', UserWalletController.getUserWallet);

/**
 * @route   POST /api/user-wallet/transaction
 * @desc    Create manual transaction (deposit/withdraw)
 * @access  Master Admin, Franchise Admin
 */
router.post(
    '/transaction',
    validatorMiddleware(userWalletValidator.createTransaction),
    UserWalletController.createTransaction
);

/**
 * @route   DELETE /api/user-wallet/transaction/:id
 * @desc    Delete transaction
 * @access  Master Admin, Franchise Admin
 */
router.delete('/transaction/:id', UserWalletController.deleteTransaction);

export default router;
