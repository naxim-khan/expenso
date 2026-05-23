import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import {
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  REFRESH_TOKEN_EXPIRES_KEY,
  SHA256_HEX_LENGTH,
} from '../../common/constants/security.constants';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';

export type RefreshTokenDataClient = Pick<PrismaService, 'userSession'>;

@Injectable()
export class RefreshTokenService implements OnModuleInit, OnModuleDestroy {
  private static readonly SESSION_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
  private readonly logger = new Logger(RefreshTokenService.name);
  private cleanupInterval?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessionsInBackground();
    }, RefreshTokenService.SESSION_CLEANUP_INTERVAL_MS);
    this.cleanupInterval.unref();

    this.cleanupExpiredSessionsInBackground();
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  createSessionId(): string {
    return randomUUID();
  }

  createSession(
    userId: string,
    refreshToken: string,
    client: RefreshTokenDataClient = this.prisma,
    sessionId = this.createSessionId(),
    deviceInfo?: string,
  ): Promise<{ id: string }> {
    this.cleanupExpiredSessionsInBackground();

    return client.userSession.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        deviceInfo,
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
      select: { id: true },
    });
  }

  async rotateRefreshToken(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ) {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: {
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
      },
    });
  }

  async isRefreshTokenValid(
    userId: string,
    sessionId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const session = await this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
        expiresAt: { gt: new Date() },
      },
      select: { refreshTokenHash: true },
    });

    if (!session) {
      this.logger.warn(
        `Refresh token validation failed for user ${userId} and session ${sessionId}`,
      );
      return false;
    }

    const isValid = this.compareRefreshToken(
      refreshToken,
      session.refreshTokenHash,
    );

    if (!isValid) {
      this.logger.warn(
        `Refresh token hash mismatch for user ${userId} and session ${sessionId}`,
      );
    }

    return isValid;
  }

  async invalidateRefreshToken(userId: string) {
    await this.prisma.userSession.deleteMany({
      where: { userId },
    });
  }

  async deleteExpiredSessions(referenceDate = new Date()): Promise<number> {
    const result = await this.prisma.userSession.deleteMany({
      where: {
        expiresAt: { lte: referenceDate },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired user sessions`);
    }

    return result.count;
  }

  private cleanupExpiredSessionsInBackground() {
    void this.deleteExpiredSessions().catch((error: unknown) => {
      this.logger.error(
        'Failed to delete expired user sessions',
        error instanceof Error ? error.stack : String(error),
      );
    });
  }

  private compareRefreshToken(
    refreshToken: string,
    storedRefreshToken: string,
  ): boolean {
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);

    return this.safeEqual(hashedRefreshToken, storedRefreshToken);
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private safeEqual(value: string, comparison: string): boolean {
    if (
      value.length !== SHA256_HEX_LENGTH ||
      comparison.length !== SHA256_HEX_LENGTH
    ) {
      return false;
    }

    return timingSafeEqual(Buffer.from(value), Buffer.from(comparison));
  }

  private getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.getRefreshTokenExpiryMs());
  }

  private getRefreshTokenExpiryMs(): number {
    const value = this.configService.get<string>(REFRESH_TOKEN_EXPIRES_KEY);

    if (!value) {
      throw new AppException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        `${REFRESH_TOKEN_EXPIRES_KEY} is not configured`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const match = /^(\d+)(ms|s|m|h|d)$/.exec(value);

    if (!match) {
      throw new AppException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        `${REFRESH_TOKEN_EXPIRES_KEY} must use ms, s, m, h, or d duration`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }
}
