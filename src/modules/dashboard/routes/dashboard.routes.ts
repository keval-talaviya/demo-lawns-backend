// src/modules/dashboard/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(getModuleRateLimiter('dashboard'));

router.get('/', DashboardController.getDashboard);

export default router;
