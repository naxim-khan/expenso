import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthUserService } from './auth-user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { AuthMapper } from './mappers/auth.mapper';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    PrismaModule,
    CategoriesModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRegistrationService,
    AuthUserService,
    AuthMapper,
    AuthRateLimitGuard,
    PasswordService,
    RefreshTokenService,
    TokenService,
    JwtStrategy,
  ],
})
export class AuthModule {}
