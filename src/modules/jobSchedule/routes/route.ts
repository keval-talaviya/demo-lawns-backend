import { Router } from 'express';
import mobileRoutes from './mobileJobScheduleRoute';
import webRoutes from './webJobScheduleRoute';

const router = Router();

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;
