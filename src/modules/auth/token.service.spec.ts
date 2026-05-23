import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { Role } from '../../generated/prisma/client';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };

  const user = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.USER,
    createdAt: new Date('2026-05-23T00:00:00.000Z'),
    updatedAt: new Date('2026-05-23T00:00:00.000Z'),
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn((_payload, options) =>
        options.secret === 'access-secret'
          ? Promise.resolve('access-token')
          : Promise.resolve('refresh-token'),
      ),
      verifyAsync: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          ACCESS_TOKEN_EXPIRES: '15m',
          REFRESH_TOKEN_EXPIRES: '7d',
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    service = new TokenService(
      jwtService as unknown as JwtService,
      configService,
    );
  });

  it('generates access and refresh tokens from a public user', async () => {
    await expect(service.generateTokenPair(user, 'session-1')).resolves.toEqual(
      {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      },
    );

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        email: 'test@example.com',
        role: Role.USER,
        sessionId: 'session-1',
      },
      expect.objectContaining({
        secret: 'access-secret',
        expiresIn: '15m',
        jwtid: expect.any(String),
      }),
    );
  });

  it('verifies refresh tokens', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      role: Role.USER,
      sessionId: 'session-1',
    });

    await expect(service.verifyRefreshToken('refresh-token')).resolves.toEqual({
      userId: 'user-1',
      email: 'test@example.com',
      role: Role.USER,
      sessionId: 'session-1',
    });
  });

  it('throws AppException for invalid refresh tokens', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid token'));

    await expect(
      service.verifyRefreshToken('bad-token'),
    ).rejects.toMatchObject<AppException>({
      code: ErrorCodes.UNAUTHORIZED_ACCESS,
    });
  });
});
