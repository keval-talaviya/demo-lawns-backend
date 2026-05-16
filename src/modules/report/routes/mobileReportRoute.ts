import { Router } from 'express';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
import { MobileReportController } from '../controllers/mobileReport.controller';

const router = Router();

router.use(getModuleRateLimiter('report-mobile'));


export default router;
