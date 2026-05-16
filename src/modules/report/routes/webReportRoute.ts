import { Router } from 'express';
import { getModuleRateLimiter } from '../../../common/rateLimiter';
import { WebReportController } from '../controllers/webReport.controller';

const router = Router();

router.use(getModuleRateLimiter('report-web'));


export default router;
