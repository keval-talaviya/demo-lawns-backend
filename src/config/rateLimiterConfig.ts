import { RateLimitRequestHandler } from 'express-rate-limit';

export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}

export interface RateLimiterConfig {
  global: RateLimiterOptions;
  modules: Record<string, RateLimiterOptions>;
}

export const defaultRateLimiterConfig: RateLimiterConfig = {
  global: {
    windowMs: 60_000,
    max: 100,
  },
  modules: {
    auth: {
      windowMs: 15 * 60_000,
      max: 20,
      message: 'Too many auth attempts, please try again later.',
    },
    user: {
      windowMs: 60_000,
      max: 120,
    },
    'user-mobile': {
      windowMs: 60_000,
      max: 60,
    },
    'user-web': {
      windowMs: 60_000,
      max: 100,
    },
  },
};

