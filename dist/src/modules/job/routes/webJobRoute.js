"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webJob_controller_1 = require("../controllers/webJob.controller");
const authMiddleware_1 = require("../../../middlewares/authMiddleware");
const franchiseFilter_1 = require("../../../middlewares/franchiseFilter");
const validatorMiddleware_1 = require("../../../middlewares/validatorMiddleware");
const job_validator_1 = require("../validators/job.validator");
const rateLimiter_1 = require("../../../common/rateLimiter");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use(franchiseFilter_1.addFranchiseFilter);
router.use((0, rateLimiter_1.getModuleRateLimiter)('job-web'));
router.post('/create', (0, validatorMiddleware_1.validatorMiddleware)(job_validator_1.createJobSchema), webJob_controller_1.JobController.create);
router.post('/list', webJob_controller_1.JobController.list);
router.get('/getById', webJob_controller_1.JobController.getById);
router.post('/update', (0, validatorMiddleware_1.validatorMiddleware)(job_validator_1.updateJobSchema), webJob_controller_1.JobController.update);
router.delete('/delete', webJob_controller_1.JobController.remove);
router.put('/complete', webJob_controller_1.JobController.complete);
router.put('/cancel', webJob_controller_1.JobController.cancel);
// Schedule routes
const webJobSchedule_controller_1 = require("../controllers/webJobSchedule.controller");
const jobSchedule_validator_1 = require("../validators/jobSchedule.validator");
router.get('/schedule/month', (0, validatorMiddleware_1.validatorMiddleware)(jobSchedule_validator_1.monthViewSchema), webJobSchedule_controller_1.JobScheduleController.getMonthView);
router.get('/schedule/week', (0, validatorMiddleware_1.validatorMiddleware)(jobSchedule_validator_1.weekViewSchema), webJobSchedule_controller_1.JobScheduleController.getWeekView);
router.get('/schedule/day', (0, validatorMiddleware_1.validatorMiddleware)(jobSchedule_validator_1.dayViewSchema), webJobSchedule_controller_1.JobScheduleController.getDayView);
router.get('/schedule/stats', (0, validatorMiddleware_1.validatorMiddleware)(jobSchedule_validator_1.scheduleStatsSchema), webJobSchedule_controller_1.JobScheduleController.getScheduleStats);
exports.default = router;
//# sourceMappingURL=webJobRoute.js.map