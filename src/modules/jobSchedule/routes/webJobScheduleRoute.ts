import { Router } from 'express';
import { getModuleRateLimiter } from '../../../common/rateLimiter';
import { WebJobScheduleController } from '../controllers/webJobSchedule.controller';

const router = Router();

router.use(getModuleRateLimiter('jobSchedule-web'));


export default router;
