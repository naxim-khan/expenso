import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Role } from '../../generated/prisma/client';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: jest.Mocked<
    Pick<
      DashboardService,
      | 'getOverview'
      | 'getExpenseByCategory'
      | 'getIncomeVsExpense'
      | 'getCashFlow'
      | 'getTopCategories'
      | 'getRecentTransactions'
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
      getOverview: jest.fn(),
      getExpenseByCategory: jest.fn(),
      getIncomeVsExpense: jest.fn(),
      getCashFlow: jest.fn(),
      getTopCategories: jest.fn(),
      getRecentTransactions: jest.fn(),
    };
    controller = new DashboardController(
      service as unknown as DashboardService,
    );
  });

  it('delegates overview requests with authenticated user id', async () => {
    service.getOverview.mockResolvedValue({
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      savingsRate: 0,
      transactionCount: 0,
      averageExpense: 0,
      highestExpenseCategory: null,
      highestIncomeCategory: null,
    });

    await controller.getOverview(request, {});

    expect(service.getOverview).toHaveBeenCalledWith('user-1', {});
  });

  it('delegates recent transactions with query filters', async () => {
    service.getRecentTransactions.mockResolvedValue({
      data: [],
      meta: {
        limit: 5,
        nextCursor: null,
        hasNext: false,
      },
    });

    await controller.getRecentTransactions(request, { limit: 5 });

    expect(service.getRecentTransactions).toHaveBeenCalledWith('user-1', {
      limit: 5,
    });
  });
});
