import { TransactionType } from '../../../generated/prisma/client';

export type DashboardGroupBy = 'day' | 'week' | 'month';

export type DashboardDateRange = {
  gte?: Date;
  lte?: Date;
};

export type DashboardQuery = {
  userId: string;
  dateRange?: DashboardDateRange;
  type?: TransactionType;
  categoryId?: string;
};

export type DashboardTrendQuery = DashboardQuery & {
  groupBy: DashboardGroupBy;
};

export type RecentTransactionsQuery = DashboardQuery & {
  limit?: number;
  cursor?: string;
};

export type TopCategoriesQuery = DashboardQuery & {
  limit: number;
  type: TransactionType;
};
