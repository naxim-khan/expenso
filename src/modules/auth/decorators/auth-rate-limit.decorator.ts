import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_KEY = 'auth-rate-limit';

export type AuthRateLimitOptions = {
  limit: number;
  ttlMs: number;
  keyByBodyField?: string;
};

export const AuthRateLimit = (options: AuthRateLimitOptions) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, options);
