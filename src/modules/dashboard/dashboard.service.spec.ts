import { CategoryType, TransactionType } from '../../generated/prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardMapper } from './mappers/dashboard.mapper';
import { DashboardQueryRepository } from './repositories/query.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: jest.Mocked<
    Pick<
      DashboardQueryRepository,
      | 'getTotalByType'
      | 'countTransactions'
      | 'getAverageExpense'
      | 'getHighestCategoryByType'
      | 'getExpenseByCategory'
      | 'getTrend'
      | 'getTopCategories'
      | 'getRecentTransactions'
    >
  >;

  beforeEach(() => {
    repository = {
      getTotalByType: jest.fn(),
      countTransactions: jest.fn(),
      getAverageExpense: jest.fn(),
      getHighestCategoryByType: jest.fn(),
      getExpenseByCategory: jest.fn(),
      getTrend: jest.fn(),
      getTopCategories: jest.fn(),
      getRecentTransactions: jest.fn(),
    };

    service = new DashboardService(
      repository as unknown as DashboardQueryRepository,
      new DashboardMapper(),
    );
  });

  it('builds an overview using repository aggregations', async () => {
    repository.getTotalByType
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(250);
    repository.countTransactions.mockResolvedValue(4);
    repository.getAverageExpense.mockResolvedValue(125);
    repository.getHighestCategoryByType
      .mockResolvedValueOnce({
        categoryId: 'expense-category',
        categoryName: 'Food',
        total: 250,
      })
      .mockResolvedValueOnce({
        categoryId: 'income-category',
        categoryName: 'Salary',
        total: 1000,
      });

    const result = await service.getOverview('user-1', {});

    expect(result).toMatchObject({
      totalIncome: 1000,
      totalExpense: 250,
      netBalance: 750,
      savingsRate: 75,
      transactionCount: 4,
      averageExpense: 125,
    });
    expect(repository.getTotalByType).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        dateRange: undefined,
        type: undefined,
        categoryId: undefined,
      },
      TransactionType.INCOME,
    );
  });

  it('gives start/end date filters priority over month/year filters', async () => {
    repository.getTrend.mockResolvedValue([]);

    await service.getIncomeVsExpense('user-1', {
      startDate: '2026-05-10',
      endDate: '2026-05-20',
      month: 1,
      year: 2020,
      groupBy: 'day',
    });

    expect(repository.getTrend).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        groupBy: 'day',
        dateRange: {
          gte: new Date('2026-05-10T00:00:00.000Z'),
          lte: new Date('2026-05-20T23:59:59.999Z'),
        },
      }),
    );
  });

  it('uses cursor pagination helpers for recent transactions', async () => {
    repository.getRecentTransactions.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Lunch',
        amount: 20,
        type: CategoryType.EXPENSE,
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
        category: {
          id: 'category-1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
      },
      {
        id: 'transaction-2',
        title: 'Dinner',
        amount: 30,
        type: TransactionType.EXPENSE,
        createdAt: new Date('2026-05-19T00:00:00.000Z'),
        category: {
          id: 'category-1',
          name: 'Food',
          type: TransactionType.EXPENSE,
        },
      },
    ]);

    const result = await service.getRecentTransactions('user-1', { limit: 1 });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      limit: 1,
      nextCursor: 'transaction-1',
      hasNext: true,
    });
  });
});
