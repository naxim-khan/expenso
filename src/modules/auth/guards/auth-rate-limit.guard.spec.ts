import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';

describe('AuthRateLimitGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: AuthRateLimitGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new AuthRateLimitGuard(reflector as unknown as Reflector);
  });

  it('allows requests when no auth rate limit metadata is configured', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('blocks requests after the configured limit is exceeded', () => {
    reflector.getAllAndOverride.mockReturnValue({
      limit: 2,
      ttlMs: 60_000,
      keyByBodyField: 'email',
    });
    const context = createContext({
      ip: '127.0.0.1',
      body: { email: 'USER@example.com ' },
    });

    expect(guard.canActivate(context)).toBe(true);
    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrow(
      expect.objectContaining({
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      }),
    );
  });
});

function createContext(request = { ip: '127.0.0.1', body: {} }) {
  class Controller {}
  const handler = function handler() {};

  return {
    getClass: () => Controller,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}
