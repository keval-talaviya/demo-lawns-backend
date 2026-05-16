import { Router } from 'express';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';
import { MobileJobScheduleController } from '../controllers/mobileJobSchedule.controller';

const router = Router();

router.use(getModuleRateLimiter('jobSchedule-mobile'));


export default router;
