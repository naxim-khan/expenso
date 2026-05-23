import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app-bootstrap';
import {
  CategoryType,
  Role,
  TransactionType,
} from '../src/generated/prisma/client';
import { DEFAULT_CATEGORIES } from '../src/modules/categories/constants/default-categories';
import { PasswordService } from '../src/modules/auth/password.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let passwordService: PasswordService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    passwordService = app.get(PasswordService);
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email: 'register@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          name: 'Test User',
          email: 'register@example.com',
          role: Role.USER,
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      },
      meta: {},
    });
    expect(response.body.data.user.password).toBeUndefined();
    expect(response.body.data.user.refreshToken).toBeUndefined();

    const defaultCategoryCount = await prisma.category.count({
      where: {
        userId: response.body.data.user.id,
        isSystem: true,
        version: 1,
      },
    });
    expect(defaultCategoryCount).toBe(DEFAULT_CATEGORIES.length);
  });

  it('logs in and returns tokens', async () => {
    await createUser('login@example.com', 'password123');

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'User logged in successfully',
      data: {
        user: {
          email: 'login@example.com',
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      },
    });
  });

  it('refreshes tokens and rotates the stored session refresh token', async () => {
    const loginResponse = await registerAndLogin('refresh@example.com');
    const oldRefreshToken = loginResponse.body.data.tokens.refreshToken;
    const storedRefreshTokenBeforeRefresh = await waitForStoredRefreshToken(
      'refresh@example.com',
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefreshToken })
      .expect(201);

    const storedRefreshTokenAfterRefresh =
      await waitForStoredRefreshTokenChange(
        'refresh@example.com',
        storedRefreshTokenBeforeRefresh,
      );

    expect(response.body).toMatchObject({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      },
    });
    expect(storedRefreshTokenAfterRefresh).not.toEqual(
      storedRefreshTokenBeforeRefresh,
    );
  });

  it('supports multiple sessions per user', async () => {
    await createUser('multi-session@example.com', 'password123');

    const firstLogin = await login('multi-session@example.com', 'password123');
    const secondLogin = await login('multi-session@example.com', 'password123');

    await waitForStoredRefreshTokenValue(
      'multi-session@example.com',
      firstLogin.body.data.tokens.refreshToken,
    );
    await waitForStoredRefreshTokenValue(
      'multi-session@example.com',
      secondLogin.body.data.tokens.refreshToken,
    );

    const sessionCount = await prisma.userSession.count({
      where: {
        user: { email: 'multi-session@example.com' },
      },
    });
    expect(sessionCount).toBe(2);
  });

  it('rejects refresh tokens for expired sessions', async () => {
    const loginResponse = await registerAndLogin('expired-session@example.com');
    const refreshToken = loginResponse.body.data.tokens.refreshToken;

    await prisma.userSession.updateMany({
      where: {
        user: { email: 'expired-session@example.com' },
      },
      data: {
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
          },
        });
      });
  });

  it('logs out and invalidates all stored sessions', async () => {
    const loginResponse = await registerAndLogin('logout@example.com');
    const accessToken = loginResponse.body.data.tokens.accessToken;

    await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          success: true,
          message: 'User logged out successfully',
          data: { loggedOut: true },
        });
      });

    const sessionCount = await prisma.userSession.count({
      where: {
        user: { email: 'logout@example.com' },
      },
    });
    expect(sessionCount).toBe(0);
  });

  it('protects the current user route', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    const loginResponse = await registerAndLogin('me@example.com');
    const accessToken = loginResponse.body.data.tokens.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          success: true,
          message: 'Current user retrieved successfully',
          data: {
            email: 'me@example.com',
            role: Role.USER,
          },
        });
        expect(body.data.password).toBeUndefined();
      });
  });

  it('enforces admin-only RBAC access', async () => {
    const userLogin = await registerAndLogin('user-rbac@example.com');
    const userAccessToken = userLogin.body.data.tokens.accessToken;

    await createUser('admin@example.com', 'password123', Role.ADMIN);
    const adminLogin = await login('admin@example.com', 'password123');
    const adminAccessToken = adminLogin.body.data.tokens.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/auth/admin-only')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/auth/admin-only')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          success: true,
          message: 'Admin access granted',
          data: { allowed: true },
        });
      });
  });

  it('protects category CRUD, cursor pagination, and user scoping', async () => {
    await request(app.getHttpServer()).get('/api/v1/categories').expect(401);

    const ownerLogin = await registerAndLogin('category-owner@example.com');
    const ownerToken = ownerLogin.body.data.tokens.accessToken;
    const otherLogin = await registerAndLogin('category-other@example.com');
    const otherToken = otherLogin.body.data.tokens.accessToken;

    const defaultCategories = await request(app.getHttpServer())
      .get('/api/v1/categories?limit=100')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(defaultCategories.body.data).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(defaultCategories.body.data[0]).toMatchObject({
      isSystem: true,
      version: 1,
    });

    const firstCategory = await createCategory(ownerToken, {
      name: 'Custom Food',
      type: CategoryType.EXPENSE,
    });
    await createCategory(ownerToken, {
      name: 'Custom Travel',
      type: CategoryType.EXPENSE,
    });
    await createCategory(ownerToken, {
      name: 'Custom Salary',
      type: CategoryType.INCOME,
    });

    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: ' custom   FOOD ',
        type: CategoryType.EXPENSE,
      })
      .expect(409);

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/categories?limit=2')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(firstPage.body).toMatchObject({
      success: true,
      message: 'Categories retrieved successfully',
      meta: {
        limit: 2,
        hasNext: true,
        nextCursor: expect.any(String),
      },
    });
    expect(firstPage.body.data).toHaveLength(2);

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/v1/categories?limit=2&cursor=${firstPage.body.meta.nextCursor}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(secondPage.body.meta).toMatchObject({
      limit: 2,
    });
    expect(secondPage.body.data).toHaveLength(2);

    await request(app.getHttpServer())
      .get(`/api/v1/categories/${firstCategory.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${firstCategory.body.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Groceries' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.name).toBe('Groceries');
      });
  });

  it('handles transaction CRUD, validation, pagination, and cross-user isolation', async () => {
    await request(app.getHttpServer()).get('/api/v1/transactions').expect(401);

    const ownerLogin = await registerAndLogin('transaction-owner@example.com');
    const ownerToken = ownerLogin.body.data.tokens.accessToken;
    const otherLogin = await registerAndLogin('transaction-other@example.com');
    const otherToken = otherLogin.body.data.tokens.accessToken;

    const expenseCategory = await findCategoryByName(
      ownerToken,
      'Food',
      CategoryType.EXPENSE,
    );
    const incomeCategory = await findCategoryByName(
      ownerToken,
      'Salary',
      CategoryType.INCOME,
    );

    await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Invalid Salary Expense',
        amount: 100,
        type: TransactionType.EXPENSE,
        categoryId: incomeCategory.id,
      })
      .expect(400);

    const firstTransaction = await createTransaction(ownerToken, {
      title: 'Lunch',
      amount: 25,
      type: TransactionType.EXPENSE,
      categoryId: expenseCategory.id,
    });
    await createTransaction(ownerToken, {
      title: 'Dinner',
      amount: 35,
      type: TransactionType.EXPENSE,
      categoryId: expenseCategory.id,
    });
    await createTransaction(ownerToken, {
      title: 'Coffee',
      amount: 5,
      type: TransactionType.EXPENSE,
      categoryId: expenseCategory.id,
    });

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/transactions?limit=2&type=EXPENSE')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(firstPage.body).toMatchObject({
      success: true,
      message: 'Transactions retrieved successfully',
      meta: {
        limit: 2,
        hasNext: true,
        nextCursor: expect.any(String),
      },
    });
    expect(firstPage.body.data).toHaveLength(2);

    await request(app.getHttpServer())
      .get(`/api/v1/transactions/${firstTransaction.body.data.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .patch(`/api/v1/transactions/${firstTransaction.body.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ amount: 50, note: 'Updated' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toMatchObject({
          amount: 50,
          note: 'Updated',
        });
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/categories/${expenseCategory.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(409);

    await request(app.getHttpServer())
      .delete(`/api/v1/transactions/${firstTransaction.body.data.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
  });

  async function registerAndLogin(email: string) {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'password123',
      })
      .expect(201);

    const loginResponse = await login(email, 'password123');

    await waitForStoredRefreshTokenValue(
      email,
      loginResponse.body.data.tokens.refreshToken,
    );

    return loginResponse;
  }

  async function login(email: string, password: string) {
    return request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
  }

  async function createUser(
    email: string,
    password: string,
    role: Role = Role.USER,
  ) {
    const hashedPassword = await passwordService.hashPassword(password);

    return prisma.user.create({
      data: {
        name: 'Test User',
        email,
        password: hashedPassword,
        role,
      },
    });
  }

  function createCategory(
    accessToken: string,
    data: { name: string; type: CategoryType },
  ) {
    return request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(data)
      .expect(201);
  }

  async function findCategoryByName(
    accessToken: string,
    name: string,
    type: CategoryType,
  ) {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/categories?limit=100&type=${type}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const category = response.body.data.find(
      (item: { name: string }) => item.name === name,
    );

    if (!category) {
      throw new Error(`Category not found: ${name}`);
    }

    return category as { id: string; name: string; type: CategoryType };
  }

  function createTransaction(
    accessToken: string,
    data: {
      title: string;
      amount: number;
      type: TransactionType;
      categoryId: string;
      note?: string;
    },
  ) {
    return request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(data)
      .expect(201);
  }

  async function waitForStoredRefreshToken(email: string): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const session = await prisma.userSession.findFirst({
        where: { user: { email } },
        orderBy: { createdAt: 'desc' },
        select: { refreshTokenHash: true },
      });

      if (session?.refreshTokenHash) {
        return session.refreshTokenHash;
      }

      await wait(25);
    }

    throw new Error(`Timed out waiting for refresh token storage: ${email}`);
  }

  async function waitForStoredRefreshTokenChange(
    email: string,
    previousRefreshToken: string,
  ): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const session = await prisma.userSession.findFirst({
        where: { user: { email } },
        orderBy: { createdAt: 'desc' },
        select: { refreshTokenHash: true },
      });

      if (
        session?.refreshTokenHash &&
        session.refreshTokenHash !== previousRefreshToken
      ) {
        return session.refreshTokenHash;
      }

      await wait(25);
    }

    throw new Error(`Timed out waiting for refresh token rotation: ${email}`);
  }

  async function waitForStoredRefreshTokenValue(
    email: string,
    refreshToken: string,
  ): Promise<string> {
    const expectedRefreshTokenHash = hashRefreshToken(refreshToken);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const session = await prisma.userSession.findFirst({
        where: {
          refreshTokenHash: expectedRefreshTokenHash,
          user: { email },
        },
        select: { refreshTokenHash: true },
      });

      if (session?.refreshTokenHash === expectedRefreshTokenHash) {
        return session.refreshTokenHash;
      }

      await wait(25);
    }

    throw new Error(`Timed out waiting for exact refresh token: ${email}`);
  }

  function hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
});
