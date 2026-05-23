import { CategoryType, TransactionType } from '../../generated/prisma/client';
import { ReportsMapper } from './mappers/reports.mapper';
import { ReportsQueryRepository } from './repositories/query.repository';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: jest.Mocked<
    Pick<
      ReportsQueryRepository,
      | 'getSummaryAggregates'
      | 'getTransactions'
      | 'getPeriodTotals'
      | 'getCategoryTotals'
      | 'countTransactions'
    >
  >;

  beforeEach(() => {
    repository = {
      getSummaryAggregates: jest.fn(),
      getTransactions: jest.fn(),
      getPeriodTotals: jest.fn(),
      getCategoryTotals: jest.fn(),
      countTransactions: jest.fn(),
    };

    service = new ReportsService(
      repository as unknown as ReportsQueryRepository,
      new ReportsMapper(),
    );
  });

  it('builds a financial summary from repository aggregates', async () => {
    repository.getSummaryAggregates.mockResolvedValue([
      {
        type: TransactionType.INCOME,
        total: 1000,
        average: 1000,
        highest: 1000,
        count: 1,
      },
      {
        type: TransactionType.EXPENSE,
        total: 250,
        average: 125,
        highest: 150,
        count: 2,
      },
    ]);

    const result = await service.getSummary('user-1', {});

    expect(result).toEqual({
      totalIncome: 1000,
      totalExpense: 250,
      netBalance: 750,
      savingsRate: 75,
      totalTransactions: 3,
      averageIncome: 1000,
      averageExpense: 125,
      highestExpense: 150,
      highestIncome: 1000,
    });
    expect(repository.getSummaryAggregates).toHaveBeenCalledWith({
      userId: 'user-1',
      dateRange: undefined,
      type: undefined,
      categoryId: undefined,
    });
  });

  it('gives start/end date filters priority over month/year filters', async () => {
    repository.getPeriodTotals.mockResolvedValue([]);

    await service.getSpendingTrends('user-1', {
      startDate: '2026-05-10',
      endDate: '2026-05-20',
      month: 1,
      year: 2020,
      groupBy: 'day',
    });

    expect(repository.getPeriodTotals).toHaveBeenCalledWith(
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

  it('uses shared cursor pagination for transaction reports', async () => {
    repository.getTransactions.mockResolvedValue([
      {
        id: 'transaction-1',
        title: 'Lunch',
        amount: 20,
        type: TransactionType.EXPENSE,
        note: null,
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
        note: null,
        createdAt: new Date('2026-05-19T00:00:00.000Z'),
        category: {
          id: 'category-1',
          name: 'Food',
          type: CategoryType.EXPENSE,
        },
      },
    ]);

    const result = await service.getTransactions('user-1', {
      limit: 1,
      sortBy: 'amount',
      sortOrder: 'asc',
      minAmount: 0,
      maxAmount: 50,
      search: ' Lunch ',
    });

    expect(repository.getTransactions).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'amount',
        sortOrder: 'asc',
        amountRange: { gte: 0, lte: 50 },
        search: 'Lunch',
      }),
    );
    expect(result).toEqual({
      data: [expect.objectContaining({ id: 'transaction-1' })],
      meta: {
        limit: 1,
        nextCursor: 'transaction-1',
        hasNext: true,
      },
    });
  });

  it('defaults top category reports to expense categories with limit 10', async () => {
    repository.getCategoryTotals.mockResolvedValue([]);

    await service.getTopCategories('user-1', {});

    expect(repository.getCategoryTotals).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        type: TransactionType.EXPENSE,
        limit: 10,
      }),
    );
  });

  it('rejects invalid amount ranges before querying', async () => {
    await expect(
      service.getTransactions('user-1', {
        minAmount: 100,
        maxAmount: 50,
      }),
    ).rejects.toThrow('minAmount must be less than or equal to maxAmount');
    expect(repository.getTransactions).not.toHaveBeenCalled();
  });
});
