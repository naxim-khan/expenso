import { randomUUID } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  ACCESS_TOKEN_EXPIRES_KEY,
  JWT_ACCESS_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  REFRESH_TOKEN_EXPIRES_KEY,
} from '../../common/constants/security.constants';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { PublicUser, TokenPair } from './interfaces/auth.types';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getRequiredConfig(JWT_ACCESS_SECRET_KEY),
      expiresIn: this.getTokenExpiry(ACCESS_TOKEN_EXPIRES_KEY),
      jwtid: randomUUID(),
    });
  }

  generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.getRequiredConfig(JWT_REFRESH_SECRET_KEY),
      expiresIn: this.getTokenExpiry(REFRESH_TOKEN_EXPIRES_KEY),
      jwtid: randomUUID(),
    });
  }

  async generateTokenPair(
    user: PublicUser,
    sessionId: string,
  ): Promise<TokenPair> {
    const payload = this.createPayload(user, sessionId);
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload),
      this.generateRefreshToken(payload),
    ]);

    return { accessToken, refreshToken };
  }

  private createPayload(user: PublicUser, sessionId: string): JwtPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.getRequiredConfig(JWT_REFRESH_SECRET_KEY),
      });
    } catch {
      throw new AppException(
        ErrorCodes.UNAUTHORIZED_ACCESS,
        'Unauthorized access',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);

    if (!value) {
      throw new AppException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        `${key} is not configured`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return value;
  }

  private getTokenExpiry(key: string): JwtSignOptions['expiresIn'] {
    return this.getRequiredConfig(key) as JwtSignOptions['expiresIn'];
  }
}
