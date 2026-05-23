import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app-bootstrap';
import { CategoryType, TransactionType } from '../src/generated/prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';

type ReportTransactionResponse = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
};

describe('Reports (e2e)', () => {
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

  it('requires authentication for report endpoints', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reports/summary')
      .expect(401);
  });

  it('returns user-scoped summary aggregations with date filters', async () => {
    const owner = await createReportsFixture('reports-owner@example.com');
    await createReportsFixture('reports-other@example.com', {
      includeNoise: true,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/summary?startDate=2026-05-01&endDate=2026-05-31')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Financial summary report retrieved successfully',
      data: {
        totalIncome: 1000,
        totalExpense: 150,
        netBalance: 850,
        savingsRate: 85,
        totalTransactions: 3,
        averageIncome: 1000,
        averageExpense: 75,
        highestExpense: 100,
        highestIncome: 1000,
      },
      meta: {},
    });
  });

  it('returns filtered, sorted, cursor-paginated transaction reports', async () => {
    const owner = await createReportsFixture('reports-table@example.com');

    const filtered = await request(app.getHttpServer())
      .get(
        `/api/v1/reports/transactions?limit=2&type=EXPENSE&categoryId=${owner.foodCategoryId}&startDate=2026-05-01&endDate=2026-05-31&sortBy=amount&sortOrder=asc&minAmount=50&maxAmount=100&search=n`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const filteredTransactions = filtered.body
      .data as ReportTransactionResponse[];

    expect(filtered.body).toMatchObject({
      success: true,
      message: 'Transactions report retrieved successfully',
      meta: {
        limit: 2,
        nextCursor: null,
        hasNext: false,
      },
    });
    expect(filteredTransactions.map((item) => item.title)).toEqual([
      'Dinner',
      'Lunch',
    ]);
    expect(filteredTransactions[0]).toMatchObject({
      amount: 50,
      category: {
        id: owner.foodCategoryId,
        name: 'Food',
        type: CategoryType.EXPENSE,
      },
    });

    const firstPage = await request(app.getHttpServer())
      .get(
        '/api/v1/reports/transactions?limit=2&year=2026&sortBy=amount&sortOrder=asc',
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const firstPageTransactions = firstPage.body
      .data as ReportTransactionResponse[];

    expect(firstPage.body.meta).toMatchObject({
      limit: 2,
      hasNext: true,
      nextCursor: expect.any(String),
    });

    const secondPage = await request(app.getHttpServer())
      .get(
        `/api/v1/reports/transactions?limit=2&year=2026&sortBy=amount&sortOrder=asc&cursor=${firstPage.body.meta.nextCursor}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const secondPageTransactions = secondPage.body
      .data as ReportTransactionResponse[];

    expect(firstPageTransactions.map((item) => item.amount)).toEqual([50, 100]);
    expect(secondPageTransactions.map((item) => item.amount)).toEqual([
      300, 500,
    ]);
    expect(
      secondPageTransactions.some((item) =>
        firstPageTransactions.some((firstItem) => firstItem.id === item.id),
      ),
    ).toBe(false);
  });

  it('returns category, trend, monthly, cash-flow, and top-category reports', async () => {
    const owner = await createReportsFixture('reports-charts@example.com');

    const categoryBreakdown = await request(app.getHttpServer())
      .get('/api/v1/reports/category-breakdown?year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(categoryBreakdown.body.data).toEqual([
      expect.objectContaining({
        categoryName: 'Rent',
        total: 300,
        transactionCount: 1,
        percentage: 66.66666666666666,
      }),
      expect.objectContaining({
        categoryName: 'Food',
        total: 150,
        transactionCount: 2,
        percentage: 33.33333333333333,
      }),
    ]);

    const trend = await request(app.getHttpServer())
      .get('/api/v1/reports/spending-trends?groupBy=month&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(trend.body.data).toEqual([
      { period: '2026-04', income: 500, expense: 300, balance: 200 },
      { period: '2026-05', income: 1000, expense: 150, balance: 850 },
    ]);

    const monthly = await request(app.getHttpServer())
      .get('/api/v1/reports/monthly?year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(monthly.body.data).toEqual([
      {
        month: '2026-04',
        income: 500,
        expense: 300,
        balance: 200,
        savingsRate: 40,
      },
      {
        month: '2026-05',
        income: 1000,
        expense: 150,
        balance: 850,
        savingsRate: 85,
      },
    ]);

    const cashFlow = await request(app.getHttpServer())
      .get('/api/v1/reports/cash-flow?groupBy=month&year=2026')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(cashFlow.body.data).toEqual([
      { period: '2026-04', income: 500, expense: 300, runningBalance: 200 },
      { period: '2026-05', income: 1000, expense: 150, runningBalance: 1050 },
    ]);

    const topCategories = await request(app.getHttpServer())
      .get('/api/v1/reports/top-categories?year=2026&limit=2')
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

  it('prepares export preview with normalized report metadata', async () => {
    const owner = await createReportsFixture('reports-export@example.com');

    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/export-preview?year=2026&type=EXPENSE')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Report export preview retrieved successfully',
      data: {
        summary: {
          totalIncome: 0,
          totalExpense: 450,
          totalTransactions: 3,
        },
        filters: {
          year: 2026,
          type: TransactionType.EXPENSE,
        },
        generatedAt: expect.any(String),
        transactionCount: 3,
      },
      meta: {},
    });
  });

  async function createReportsFixture(
    email: string,
    options: { includeNoise?: boolean } = {},
  ) {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Reports User',
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
          note: 'noon meal',
          userId,
          categoryId: food.id,
          createdAt: new Date('2026-05-06T10:00:00.000Z'),
        },
        {
          title: 'Dinner',
          amount: options.includeNoise ? 999 : 50,
          type: TransactionType.EXPENSE,
          note: 'evening meal',
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

    return {
      accessToken,
      userId,
      foodCategoryId: food.id,
      rentCategoryId: rent.id,
      salaryCategoryId: salary.id,
    };
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
