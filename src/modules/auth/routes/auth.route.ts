import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';

const router = Router();

const authLimiter = getCustomRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many auth attempts, please try again later.',
});

router.use(getModuleRateLimiter('auth'));

router.post('/register', authLimiter, validatorMiddleware(registerSchema), AuthController.register);
router.post('/login', authLimiter, validatorMiddleware(loginSchema), AuthController.login);

//franchise login 
router.post('/franchise/login', authLimiter, validatorMiddleware(loginSchema), AuthController.franchiseLogin);

export default router;
