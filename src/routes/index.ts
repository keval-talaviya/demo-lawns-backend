import { Router } from 'express';
import { getModuleRateLimiter } from '../common/rateLimiter';

// MODULE_IMPORTS
import reportRoutes from '../modules/report/routes/route';
import dailyReportRoutes from '../modules/dailyReport/routes/route';
import invoiceRoutes from '../modules/invoice/routes/route';

import jobScheduleRoutes from '../modules/jobSchedule/routes/route';
import jobRoutes from '../modules/job/routes/route';
import authRoutes from '../modules/auth/routes/auth.route';
import userRoutes from '../modules/user/routes/route';
import customerRoutes from '../modules/customer/routes/customer.route';
import quotationRoutes from '../modules/quotation/routes/quotation.route';
import franchiseRoutes from '../modules/franchise/routes/franchise.route';
import serviceRoutes from '../modules/services/routes/route';
import inquiryRoutes from '../modules/inquiry/routes/route';
import transactionRoutes from '../modules/transaction/routes/transaction.routes';
import companySettingsRoutes from '../modules/companySettings/routes/route';
import userWalletRoutes from '../modules/userWallet/routes/route';
import dashboardRoutes from '../modules/dashboard/routes/dashboard.routes';
import { UnifiedTransactionController } from '../controllers/unifiedTransaction.controller';
import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// MODULE_ROUTES
router.use('/report', getModuleRateLimiter('report'), reportRoutes);
router.use('/daily-report', getModuleRateLimiter('dailyReport'), dailyReportRoutes);
router.use('/invoice', getModuleRateLimiter('invoice'), invoiceRoutes);

router.use('/job-schedule', getModuleRateLimiter('jobSchedule'), jobScheduleRoutes);
router.use('/job', getModuleRateLimiter('job'), jobRoutes);
router.use('/auth', getModuleRateLimiter('auth'), authRoutes);
router.use('/users', getModuleRateLimiter('user'), userRoutes);
router.use('/customers', customerRoutes);
router.use('/quotations', quotationRoutes);
router.use('/franchises', franchiseRoutes);
router.use('/services', serviceRoutes);
router.use('/transactions', transactionRoutes);
router.use('/company-settings', getModuleRateLimiter('companySettings'), companySettingsRoutes);
router.use('/user-wallet', getModuleRateLimiter('userWallet'), userWalletRoutes);
router.use('/dashboard', getModuleRateLimiter('dashboard'), dashboardRoutes);

// Unified Transaction Management Routes (combines customer transactions + staff wallet)
router.get('/unified-transactions/report', authenticate, UnifiedTransactionController.getUnifiedReport);
router.get('/unified-transactions/reconcile', authenticate, UnifiedTransactionController.reconcile);
router.get('/unified-transactions/summary', authenticate, UnifiedTransactionController.getSummary);


// Public contact/inquiry endpoint (no token required)
router.use('/inquiry', inquiryRoutes);

console.log('--- [DEBUG] Main API Routes Initialized ---');
export default router;

