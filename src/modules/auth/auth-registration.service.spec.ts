import { DEFAULT_CATEGORIES } from '../categories/constants/default-categories';
import { CategoriesCommandRepository } from '../categories/repositories/command.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';
import { AuthRegistrationService } from './auth-registration.service';
import { AuthUserService } from './auth-user.service';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

describe('AuthRegistrationService', () => {
  let service: AuthRegistrationService;
  let prisma: { $transaction: jest.Mock };
  let authUserService: jest.Mocked<Pick<AuthUserService, 'createUser'>>;
  let categoriesCommandRepository: jest.Mocked<
    Pick<CategoriesCommandRepository, 'createDefaultCategories'>
  >;
  let tokenService: jest.Mocked<Pick<TokenService, 'generateTokenPair'>>;
  let refreshTokenService: jest.Mocked<
    Pick<RefreshTokenService, 'createSessionId' | 'createSession'>
  >;

  const tx = {
    user: {},
    category: {},
    userSession: {},
  };
  const now = new Date('2026-05-23T00:00:00.000Z');
  const user = {
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
    prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    authUserService = {
      createUser: jest.fn(),
    };
    categoriesCommandRepository = {
      createDefaultCategories: jest.fn(),
    };
    tokenService = {
      generateTokenPair: jest.fn(),
    };
    refreshTokenService = {
      createSessionId: jest.fn(),
      createSession: jest.fn(),
    };

    service = new AuthRegistrationService(
      prisma as unknown as PrismaService,
      authUserService as unknown as AuthUserService,
      categoriesCommandRepository as unknown as CategoriesCommandRepository,
      tokenService as unknown as TokenService,
      refreshTokenService as unknown as RefreshTokenService,
    );
  });

  it('creates a user, default categories, tokens, and stored refresh token in one transaction', async () => {
    authUserService.createUser.mockResolvedValue(user);
    categoriesCommandRepository.createDefaultCategories.mockResolvedValue({
      count: DEFAULT_CATEGORIES.length,
    });
    refreshTokenService.createSessionId.mockReturnValue('session-1');
    tokenService.generateTokenPair.mockResolvedValue(tokens);
    refreshTokenService.createSession.mockResolvedValue({ id: 'session-1' });

    await expect(
      service.registerWithDefaults({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      }),
    ).resolves.toEqual({ user, tokens });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(authUserService.createUser).toHaveBeenCalledWith(
      {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      },
      tx,
    );
    expect(
      categoriesCommandRepository.createDefaultCategories,
    ).toHaveBeenCalledWith('user-1', tx);
    expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
      user,
      'session-1',
    );
    expect(refreshTokenService.createSession).toHaveBeenCalledWith(
      'user-1',
      'refresh-token',
      tx,
      'session-1',
    );
  });

  it('does not create tokens or store refresh token when default category creation fails', async () => {
    authUserService.createUser.mockResolvedValue(user);
    categoriesCommandRepository.createDefaultCategories.mockRejectedValue(
      new Error('category bootstrap failed'),
    );

    await expect(
      service.registerWithDefaults({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      }),
    ).rejects.toThrow('category bootstrap failed');

    expect(tokenService.generateTokenPair).not.toHaveBeenCalled();
    expect(refreshTokenService.createSession).not.toHaveBeenCalled();
  });
});
