import { Router } from 'express';
import mobileRoutes from './mobileInvoiceRoute';
import webRoutes from './webInvoiceRoute';

const router = Router();

router.use((req, res, next) => {
  console.log(`--- [DEBUG] Invoice Module Entry Point: ${req.method} ${req.originalUrl} -> ${req.path} ---`);
  next();
});

router.use('/mobile', mobileRoutes);
router.use('/web', webRoutes);

export default router;
