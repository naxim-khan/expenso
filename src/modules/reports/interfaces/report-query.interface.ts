import { TransactionType } from '../../../generated/prisma/client';
import type { SortOrder } from '../../../common/utils/pagination.util';

export type ReportGroupBy = 'day' | 'week' | 'month';

export type ReportSortBy = 'createdAt' | 'amount' | 'title';

export type ReportDateRange = {
  gte?: Date;
  lte?: Date;
};

export type ReportAmountRange = {
  gte?: number;
  lte?: number;
};

export type ReportQuery = {
  userId: string;
  dateRange?: ReportDateRange;
  type?: TransactionType;
  categoryId?: string;
};

export type TransactionsReportQuery = ReportQuery & {
  limit?: number;
  cursor?: string;
  sortBy: ReportSortBy;
  sortOrder: SortOrder;
  amountRange?: ReportAmountRange;
  search?: string;
};

export type PeriodReportQuery = ReportQuery & {
  groupBy: ReportGroupBy;
};

export type CategoryReportQuery = ReportQuery & {
  type: TransactionType;
  limit?: number;
};
