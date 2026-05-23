import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesCommandRepository } from '../categories/repositories/command.repository';
import { AuthUserService } from './auth-user.service';
import { AuthResult } from './interfaces/auth.types';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class AuthRegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authUserService: AuthUserService,
    private readonly categoriesCommandRepository: CategoriesCommandRepository,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  registerWithDefaults(input: RegisterUserInput): Promise<AuthResult> {
    return this.prisma.$transaction(async (tx) => {
      const user = await this.authUserService.createUser(input, tx);

      await this.categoriesCommandRepository.createDefaultCategories(
        user.id,
        tx,
      );

      const sessionId = this.refreshTokenService.createSessionId();
      const tokens = await this.tokenService.generateTokenPair(user, sessionId);

      await this.refreshTokenService.createSession(
        user.id,
        tokens.refreshToken,
        tx,
        sessionId,
      );

      return { user, tokens };
    });
  }
}
