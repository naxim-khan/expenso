import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthUserService } from './auth-user.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResult, PublicUser } from './interfaces/auth.types';
import { AuthMapper } from './mappers/auth.mapper';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authUserService: AuthUserService,
    private readonly authRegistrationService: AuthRegistrationService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly authMapper: AuthMapper,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existingUser = await this.authUserService.findUserIdByEmail(
      dto.email,
    );

    if (existingUser) {
      throw new AppException(
        ErrorCodes.EMAIL_ALREADY_EXISTS,
        'Email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const password = await this.passwordService.hashPassword(dto.password);
    return this.authRegistrationService.registerWithDefaults({
      name: dto.name,
      email: dto.email,
      password,
    });
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.authUserService.findUserWithPasswordByEmail(
      dto.email,
    );

    if (!user) {
      throw this.invalidCredentials();
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw this.invalidCredentials();
    }

    const publicUser = this.authMapper.toPublicUser(user);
    const sessionId = this.refreshTokenService.createSessionId();
    const tokens = await this.tokenService.generateTokenPair(
      publicUser,
      sessionId,
    );

    await this.refreshTokenService.createSession(
      publicUser.id,
      tokens.refreshToken,
      undefined,
      sessionId,
    );

    return { user: publicUser, tokens };
  }

  async refresh(dto: RefreshDto): Promise<AuthResult> {
    const payload = await this.tokenService.verifyRefreshToken(
      dto.refreshToken,
    );
    const isRefreshTokenValid =
      await this.refreshTokenService.isRefreshTokenValid(
        payload.userId,
        payload.sessionId,
        dto.refreshToken,
      );

    if (!isRefreshTokenValid) {
      throw this.unauthorized();
    }

    const user = await this.authUserService.findPublicUserById(payload.userId);

    if (!user) {
      throw this.unauthorized();
    }

    const tokens = await this.tokenService.generateTokenPair(
      user,
      payload.sessionId,
    );
    await this.refreshTokenService.rotateRefreshToken(
      user.id,
      payload.sessionId,
      tokens.refreshToken,
    );

    return { user, tokens };
  }

  async logout(userId: string): Promise<{ loggedOut: boolean }> {
    await this.refreshTokenService.invalidateRefreshToken(userId);

    return { loggedOut: true };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.authUserService.findPublicUserById(userId);

    if (!user) {
      throw new AppException(
        ErrorCodes.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return user;
  }

  private invalidCredentials(): AppException {
    return new AppException(
      ErrorCodes.INVALID_CREDENTIALS,
      'Invalid credentials',
      HttpStatus.UNAUTHORIZED,
    );
  }

  private unauthorized(): AppException {
    return new AppException(
      ErrorCodes.UNAUTHORIZED_ACCESS,
      'Unauthorized access',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
