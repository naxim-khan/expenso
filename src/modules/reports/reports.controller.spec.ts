import { Role } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<
    Pick<
      ReportsService,
      | 'getSummary'
      | 'getTransactions'
      | 'getSpendingTrends'
      | 'getCategoryBreakdown'
      | 'getMonthly'
      | 'getCashFlow'
      | 'getTopCategories'
      | 'getExportPreview'
    >
  >;

  const request = {
    user: {
      userId: 'user-1',
      email: 'user@example.com',
      role: Role.USER,
    },
  } as AuthenticatedRequest;

  beforeEach(() => {
    service = {
      getSummary: jest.fn(),
      getTransactions: jest.fn(),
      getSpendingTrends: jest.fn(),
      getCategoryBreakdown: jest.fn(),
      getMonthly: jest.fn(),
      getCashFlow: jest.fn(),
      getTopCategories: jest.fn(),
      getExportPreview: jest.fn(),
    };
    controller = new ReportsController(service as unknown as ReportsService);
  });

  it('delegates summary requests with authenticated user id', async () => {
    service.getSummary.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      savingsRate: 0,
      totalTransactions: 0,
      averageIncome: 0,
      averageExpense: 0,
      highestExpense: 0,
      highestIncome: 0,
    });

    await controller.getSummary(request, { year: 2026 });

    expect(service.getSummary).toHaveBeenCalledWith('user-1', { year: 2026 });
  });

  it('delegates transaction reports with query filters', async () => {
    service.getTransactions.mockResolvedValue({
      data: [],
      meta: {
        limit: 5,
        nextCursor: null,
        hasNext: false,
      },
    });

    await controller.getTransactions(request, {
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(service.getTransactions).toHaveBeenCalledWith('user-1', {
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  });

  it('delegates export preview requests', async () => {
    service.getExportPreview.mockResolvedValue({
      summary: {
        totalIncome: 0,
        totalExpense: 0,
        netBalance: 0,
        savingsRate: 0,
        totalTransactions: 0,
        averageIncome: 0,
        averageExpense: 0,
        highestExpense: 0,
        highestIncome: 0,
      },
      filters: { year: 2026 },
      generatedAt: '2026-05-23T00:00:00.000Z',
      transactionCount: 0,
    });

    await controller.getExportPreview(request, { year: 2026 });

    expect(service.getExportPreview).toHaveBeenCalledWith('user-1', {
      year: 2026,
    });
  });
});
