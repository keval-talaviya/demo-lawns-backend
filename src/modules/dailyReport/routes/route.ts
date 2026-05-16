import { Router } from 'express';
import mobileRoutes from './mobileDailyReportRoute';
import webRoutes from './webDailyReportRoute';

const router = Router();

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;
