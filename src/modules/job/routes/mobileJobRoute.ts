import { Router } from 'express';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
import { MobileJobController } from '../controllers/mobileJob.controller';

const router = Router();

router.use(getModuleRateLimiter('job-mobile'));


export default router;
