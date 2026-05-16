import { Router } from 'express';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
import { MobileDailyReportController } from '../controllers/mobileDailyReport.controller';

const router = Router();

router.use(getModuleRateLimiter('dailyReport-mobile'));


export default router;
