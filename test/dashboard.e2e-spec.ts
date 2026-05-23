import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app-bootstrap';
import { CategoryType, TransactionType } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication for dashboard endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/overview')
      .expect(401);
  });

  it('returns user-scoped dashboard aggregations with date filters', async () => {
    const owner = await createDashboardFixture('dashboard-owner@example.com');
    await createDashboardFixture('dashboard-other@example.com', {
      includeNoise: true,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/overview?startDate=2026-05-01&endDate=2026-05-31')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      data: {
        totalIncome: 1000,
        totalExpense: 150,
        netBalance: 850,
        savingsRate: 85,
        transactionCount: 3,
        averageExpense: 75,
        highestExpenseCategory: {
          categoryName: 'Food',
          total: 150,
        },
        highestIncomeCategory: {
          categoryName: 'Salary',
          total: 1000,
        },
      },
      meta: {},
    });
  });

  it('returns expense category chart data and top categories sorted by total', async () => {
    const owner = await createDashboardFixture('dashboard-chart@example.com');

    const expenseChart = await request(app.getHttpServer())
      .get(
        '/api/v1/dashboard/expense-by-category?startDate=2026-05-01&endDate=2026-05-31',
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(expenseChart.body.data).toEqual([
      expect.objectContaining({
        categoryName: 'Food',
        total: 150,
        percentage: 100,
      }),
    ]);

    const topCategories = await request(app.getHttpServer())
      .get('/api/v1/dashboard/top-categories?type=EXPENSE&limit=2&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(topCategories.body.data).toEqual([
      expect.objectContaining({
        categoryName: 'Rent',
        total: 300,
        transactionCount: 1,
      }),
      expect.objectContaining({
        categoryName: 'Food',
        total: 150,
        transactionCount: 2,
      }),
    ]);
  });

  it('returns income vs expense trends and cash flow chronologically', async () => {
    const owner = await createDashboardFixture('dashboard-trend@example.com');

    const trend = await request(app.getHttpServer())
      .get('/api/v1/dashboard/income-vs-expense?groupBy=month&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(trend.body.data).toEqual([
      { period: '2026-04', income: 500, expense: 300 },
      { period: '2026-05', income: 1000, expense: 150 },
    ]);

    const cashFlow = await request(app.getHttpServer())
      .get('/api/v1/dashboard/cash-flow?groupBy=month&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(cashFlow.body.data).toEqual([
      { period: '2026-04', income: 500, expense: 300, balance: 200 },
      { period: '2026-05', income: 1000, expense: 150, balance: 1050 },
    ]);
  });

  it('returns cursor-paginated recent transactions with category data', async () => {
    const owner = await createDashboardFixture('dashboard-recent@example.com');

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/dashboard/recent-transactions?limit=2&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(firstPage.body).toMatchObject({
      success: true,
      message: 'Recent transactions retrieved successfully',
      meta: {
        limit: 2,
        hasNext: true,
        nextCursor: expect.any(String),
      },
    });
    expect(firstPage.body.data).toHaveLength(2);
    expect(firstPage.body.data[0].category).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      type: expect.any(String),
    });

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/v1/dashboard/recent-transactions?limit=2&year=2026&cursor=${firstPage.body.meta.nextCursor}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(secondPage.body.meta).toMatchObject({
      limit: 2,
      hasNext: true,
      nextCursor: expect.any(String),
    });
    expect(secondPage.body.data).toHaveLength(2);
  });

  async function createDashboardFixture(
    email: string,
    options: { includeNoise?: boolean } = {},
  ) {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Dashboard User',
        email,
        password: 'password123',
      })
      .expect(201);
    const accessToken = registerResponse.body.data.tokens.accessToken as string;
    const userId = registerResponse.body.data.user.id as string;
    const food = await findCategory(userId, 'Food', CategoryType.EXPENSE);
    const rent = await findCategory(userId, 'Rent', CategoryType.EXPENSE);
    const salary = await findCategory(userId, 'Salary', CategoryType.INCOME);

    await prisma.transaction.createMany({
      data: [
        {
          title: 'May salary',
          amount: options.includeNoise ? 9999 : 1000,
          type: TransactionType.INCOME,
          userId,
          categoryId: salary.id,
          createdAt: new Date('2026-05-05T10:00:00.000Z'),
        },
        {
          title: 'Lunch',
          amount: options.includeNoise ? 999 : 100,
          type: TransactionType.EXPENSE,
          userId,
          categoryId: food.id,
          createdAt: new Date('2026-05-06T10:00:00.000Z'),
        },
        {
          title: 'Dinner',
          amount: options.includeNoise ? 999 : 50,
          type: TransactionType.EXPENSE,
          userId,
          categoryId: food.id,
          createdAt: new Date('2026-05-07T10:00:00.000Z'),
        },
        {
          title: 'Rent',
          amount: options.includeNoise ? 999 : 300,
          type: TransactionType.EXPENSE,
          userId,
          categoryId: rent.id,
          createdAt: new Date('2026-04-10T10:00:00.000Z'),
        },
        {
          title: 'April salary',
          amount: options.includeNoise ? 9999 : 500,
          type: TransactionType.INCOME,
          userId,
          categoryId: salary.id,
          createdAt: new Date('2026-04-11T10:00:00.000Z'),
        },
      ],
    });

    return { accessToken, userId };
  }

  async function findCategory(
    userId: string,
    name: string,
    type: CategoryType,
  ) {
    return prisma.category.findFirstOrThrow({
      where: {
        userId,
        name,
        type,
      },
      select: {
        id: true,
      },
    });
  }
});
