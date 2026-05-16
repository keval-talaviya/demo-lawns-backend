import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { config } from '../config';
import { defaultRateLimiterConfig, RateLimiterOptions } from '../config/rateLimiterConfig';

let RedisStore: unknown;
let redisClient: unknown;

// Try to load Redis store if available (optional dependency)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RedisStore = require('rate-limit-redis');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('redis');

  if (config.redisUrl) {
    redisClient = createClient({ url: config.redisUrl });
    (redisClient as { on: (event: string, handler: (err: unknown) => void) => void }).on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Redis error', err);
    });
    void (redisClient as { connect: () => Promise<void> }).connect();
  }
} catch (error) {
  // Redis store not available, will use in-memory store
  // eslint-disable-next-line no-console
  console.warn('Redis store not available, using in-memory rate limiting');
}

const buildStore = () => {
  if (!redisClient || !RedisStore) {
    return undefined;
  }

  try {
    return new (RedisStore as new (options: { sendCommand: (...args: string[]) => unknown }) => unknown)({
      sendCommand: (...args: string[]) => (redisClient as { sendCommand: (args: string[]) => unknown }).sendCommand(args),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to create Redis store, using in-memory rate limiting', error);
    return undefined;
  }
};

export const createRateLimiter = (options: RateLimiterOptions): RateLimitRequestHandler =>
  rateLimit({
    store: buildStore() as any,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
  });

export const defaultRateLimiter = createRateLimiter({
  ...defaultRateLimiterConfig.global,
  windowMs: config.rateLimiter.windowMs,
  max: config.rateLimiter.max,
});

export const getModuleRateLimiter = (moduleKey: string): RateLimitRequestHandler => {
  const moduleConfig = defaultRateLimiterConfig.modules[moduleKey];
  if (!moduleConfig) {
    return defaultRateLimiter;
  }
  return createRateLimiter(moduleConfig);
};

export const getCustomRateLimiter = (options: RateLimiterOptions) => createRateLimiter(options);
