import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';
import {
  AUTH_RATE_LIMIT_KEY,
  AuthRateLimitOptions,
} from '../decorators/auth-rate-limit.decorator';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitRequest = Request & {
  body?: Record<string, unknown>;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<AuthRateLimitOptions>(
      AUTH_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const key = this.buildKey(context, request, options);
    const now = Date.now();
    const entry = this.getEntry(key, options, now);

    entry.count += 1;
    this.attempts.set(key, entry);
    this.pruneExpired(now);

    if (entry.count > options.limit) {
      throw new AppException(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many authentication attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getEntry(
    key: string,
    options: AuthRateLimitOptions,
    now: number,
  ): RateLimitEntry {
    const entry = this.attempts.get(key);

    if (!entry || entry.resetAt <= now) {
      return {
        count: 0,
        resetAt: now + options.ttlMs,
      };
    }

    return entry;
  }

  private buildKey(
    context: ExecutionContext,
    request: RateLimitRequest,
    options: AuthRateLimitOptions,
  ): string {
    const route = `${context.getClass().name}.${context.getHandler().name}`;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown';
    const bodyValue = options.keyByBodyField
      ? this.normalizeBodyValue(request.body?.[options.keyByBodyField])
      : undefined;

    return [route, ip, bodyValue].filter(Boolean).join(':');
  }

  private normalizeBodyValue(value: unknown): string | undefined {
    return typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  }

  private pruneExpired(now: number) {
    for (const [key, entry] of this.attempts.entries()) {
      if (entry.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}
