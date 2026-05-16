import { Router } from 'express';
import { JobController } from '../controllers/webJob.controller';
import { authenticate } from '../../../middlewares/authMiddleware';
import { addFranchiseFilter } from '../../../middlewares/franchiseFilter';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { createJobSchema, updateJobSchema } from '../validators/job.validator';
import { getModuleRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(addFranchiseFilter);
router.use(getModuleRateLimiter('job-web'));

router.post('/create', validatorMiddleware(createJobSchema), JobController.create);
router.post('/list', JobController.list);
router.get('/getById', JobController.getById);
router.post('/update', validatorMiddleware(updateJobSchema), JobController.update);
router.delete('/delete', JobController.remove);
router.put('/complete', JobController.complete);
router.put('/cancel', JobController.cancel);

// Schedule routes
import { JobScheduleController } from '../controllers/webJobSchedule.controller';
import {
    monthViewSchema,
    weekViewSchema,
    dayViewSchema,
    scheduleStatsSchema
} from '../validators/jobSchedule.validator';

router.get('/schedule/month', validatorMiddleware(monthViewSchema), JobScheduleController.getMonthView);
router.get('/schedule/week', validatorMiddleware(weekViewSchema), JobScheduleController.getWeekView);
router.get('/schedule/day', validatorMiddleware(dayViewSchema), JobScheduleController.getDayView);
router.get('/schedule/stats', validatorMiddleware(scheduleStatsSchema), JobScheduleController.getScheduleStats);

export default router;
