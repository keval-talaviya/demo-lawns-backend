import { Router } from 'express';
import { MobileUserController } from '../controllers/mobileUser.controller';
import { validatorMiddleware } from '../../../middlewares/validatorMiddleware';
import { registerSchema, loginSchema } from '../validators/user.validator';
import { getModuleRateLimiter, getCustomRateLimiter } from '../../../common/rateLimiter';

const router = Router();

router.use(getModuleRateLimiter('user-mobile'));

const authLimiter = getCustomRateLimiter({
  windowMs: 15 * 60_000,
  max: 10,
  message: 'Too many login attempts. Please try again later.',
});

router.post('/register', validatorMiddleware(registerSchema), MobileUserController.register);
router.post('/login', authLimiter, validatorMiddleware(loginSchema), MobileUserController.login);

export default router;

