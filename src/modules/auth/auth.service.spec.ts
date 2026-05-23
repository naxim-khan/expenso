import { ErrorCodes } from '../../common/constants/error-codes';
import { Role } from '../../generated/prisma/client';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthUserService } from './auth-user.service';
import { AuthService } from './auth.service';
import { AuthMapper } from './mappers/auth.mapper';
import { PasswordService } from './password.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let service: AuthService;
  let authUserService: jest.Mocked<
    Pick<
      AuthUserService,
      'findUserIdByEmail' | 'findUserWithPasswordByEmail' | 'findPublicUserById'
    >
  >;
  let authRegistrationService: jest.Mocked<
    Pick<AuthRegistrationService, 'registerWithDefaults'>
  >;
  let passwordService: jest.Mocked<
    Pick<PasswordService, 'hashPassword' | 'comparePassword'>
  >;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'generateTokenPair' | 'verifyRefreshToken'>
  >;
  let refreshTokenService: jest.Mocked<
    Pick<
      RefreshTokenService,
      | 'createSessionId'
      | 'createSession'
      | 'rotateRefreshToken'
      | 'isRefreshTokenValid'
      | 'invalidateRefreshToken'
    >
  >;

  const now = new Date('2026-05-23T00:00:00.000Z');
  const publicUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: Role.USER,
    createdAt: now,
    updatedAt: now,
  };
  const tokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    authUserService = {
      findUserIdByEmail: jest.fn(),
      findUserWithPasswordByEmail: jest.fn(),
      findPublicUserById: jest.fn(),
    };
    authRegistrationService = {
      registerWithDefaults: jest.fn(),
    };
    passwordService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };
    tokenService = {
      generateTokenPair: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };
    refreshTokenService = {
      createSessionId: jest.fn(),
      createSession: jest.fn(),
      rotateRefreshToken: jest.fn(),
      isRefreshTokenValid: jest.fn(),
      invalidateRefreshToken: jest.fn(),
    };

    service = new AuthService(
      authUserService as unknown as AuthUserService,
      authRegistrationService as unknown as AuthRegistrationService,
      passwordService,
      tokenService as unknown as TokenService,
      refreshTokenService as unknown as RefreshTokenService,
      new AuthMapper(),
    );
  });

  it('registers a user through transactional onboarding defaults', async () => {
    authUserService.findUserIdByEmail.mockResolvedValue(null);
    passwordService.hashPassword.mockResolvedValue('hashed-password');
    authRegistrationService.registerWithDefaults.mockResolvedValue({
      user: publicUser,
      tokens,
    });

    const result = await service.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ user: publicUser, tokens });
    expect(passwordService.hashPassword).toHaveBeenCalledWith('password123');
    expect(authRegistrationService.registerWithDefaults).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
    });
    expect(refreshTokenService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('rejects duplicate registration emails', async () => {
    authUserService.findUserIdByEmail.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.EMAIL_ALREADY_EXISTS,
    });
  });

  it('logs in a user and returns a public user plus tokens', async () => {
    authUserService.findUserWithPasswordByEmail.mockResolvedValue({
      ...publicUser,
      password: 'hashed-password',
    });
    passwordService.comparePassword.mockResolvedValue(true);
    refreshTokenService.createSessionId.mockReturnValue('session-1');
    refreshTokenService.createSession.mockResolvedValue({ id: 'session-1' });
    tokenService.generateTokenPair.mockResolvedValue(tokens);

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result).toEqual({ user: publicUser, tokens });
    expect(passwordService.comparePassword).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    );
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
      publicUser,
      'session-1',
    );
    expect(refreshTokenService.createSession).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
      undefined,
      'session-1',
    );
  });

  it('rejects login with invalid credentials', async () => {
    authUserService.findUserWithPasswordByEmail.mockResolvedValue({
      ...publicUser,
      password: 'hashed-password',
    });
    passwordService.comparePassword.mockResolvedValue(false);

    await expect(
      service.login({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.INVALID_CREDENTIALS,
    });
  });

  it('refreshes and rotates refresh tokens', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      email: 'test@example.com',
      role: Role.USER,
      sessionId: 'session-1',
    });
    refreshTokenService.isRefreshTokenValid.mockResolvedValue(true);
    authUserService.findPublicUserById.mockResolvedValue(publicUser);
    tokenService.generateTokenPair.mockResolvedValue(tokens);

    const result = await service.refresh({
      refreshToken: 'old-refresh-token',
    });

    expect(result).toEqual({ user: publicUser, tokens });
    expect(refreshTokenService.isRefreshTokenValid).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      'old-refresh-token',
    );
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
      publicUser,
      'session-1',
    );
    expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      'refresh-token',
    );
  });

  it('logs out by invalidating all user sessions', async () => {
    refreshTokenService.invalidateRefreshToken.mockResolvedValue(undefined);

    await expect(service.logout('user-1')).resolves.toEqual({
      loggedOut: true,
    });
    expect(refreshTokenService.invalidateRefreshToken).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('throws USER_NOT_FOUND when current user no longer exists', async () => {
    authUserService.findPublicUserById.mockResolvedValue(null);

    await expect(service.me('missing-user')).rejects.toMatchObject({
      code: ErrorCodes.USER_NOT_FOUND,
    });
  });
});
