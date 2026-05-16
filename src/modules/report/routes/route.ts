import { Router } from 'express';
import mobileRoutes from './mobileReportRoute';
import webRoutes from './webReportRoute';

const router = Router();

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;
