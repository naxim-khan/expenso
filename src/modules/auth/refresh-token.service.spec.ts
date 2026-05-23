import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: {
    userSession: {
      create: jest.Mock;
      findFirst: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      userSession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    const configService = {
      get: jest.fn(() => '7d'),
    } as unknown as ConfigService;

    service = new RefreshTokenService(
      prisma as unknown as PrismaService,
      configService,
    );
  });

  it('creates sessions with SHA-256 refresh token digests', async () => {
    prisma.userSession.create.mockResolvedValue({ id: 'session-1' });

    await service.createSession(
      'user-1',
      'refresh-token',
      prisma as unknown as PrismaService,
      'session-1',
    );

    expect(prisma.userSession.create).toHaveBeenCalledWith({
      data: {
        id: 'session-1',
        userId: 'user-1',
        refreshTokenHash: hashRefreshToken('refresh-token'),
        deviceInfo: undefined,
        expiresAt: expect.any(Date),
      },
      select: { id: true },
    });
  });

  it('validates stored session refresh token digests', async () => {
    prisma.userSession.findFirst.mockResolvedValue({
      refreshTokenHash: hashRefreshToken('refresh-token'),
    });

    await expect(
      service.isRefreshTokenValid('user-1', 'session-1', 'refresh-token'),
    ).resolves.toBe(true);
    await expect(
      service.isRefreshTokenValid('user-1', 'session-1', 'wrong-token'),
    ).resolves.toBe(false);
  });

  it('rotates session refresh token digests', async () => {
    prisma.userSession.updateMany.mockResolvedValue({ count: 1 });

    await service.rotateRefreshToken('user-1', 'session-1', 'refresh-token');

    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { id: 'session-1', userId: 'user-1' },
      data: {
        refreshTokenHash: hashRefreshToken('refresh-token'),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('invalidates all user sessions on logout', async () => {
    prisma.userSession.deleteMany.mockResolvedValue({ count: 2 });

    await service.invalidateRefreshToken('user-1');

    expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('deletes expired sessions', async () => {
    prisma.userSession.deleteMany.mockResolvedValue({ count: 1 });
    const referenceDate = new Date('2026-05-23T00:00:00.000Z');

    await service.deleteExpiredSessions(referenceDate);

    expect(prisma.userSession.deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lte: referenceDate },
      },
    });
  });
});

function hashRefreshToken(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}
