import { Router } from 'express';
import { getModuleRateLimiter } from '../../../common/rateLimiter';
import { WebDailyReportController } from '../controllers/webDailyReport.controller';

import { authenticate } from '../../../middlewares/authMiddleware';

const router = Router();

router.use(getModuleRateLimiter('dailyReport-web'));
router.use(authenticate);

router.get('/work-report', WebDailyReportController.getWorkReport);

export default router;
