import {
  CategoryType,
  TransactionType,
} from '../../../generated/prisma/client';

export type TransactionReportItem = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
};

export type ReportPeriodTotal = {
  period: string;
  type: TransactionType;
  total: number;
};

export type SpendingTrendReportItem = {
  period: string;
  income: number;
  expense: number;
  balance: number;
};

export type MonthlyFinancialReportItem = {
  month: string;
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
};

export type CashFlowReportItem = {
  period: string;
  income: number;
  expense: number;
  runningBalance: number;
};

export type ReportCategoryTotal = {
  categoryId: string;
  categoryName: string;
  total: number;
  transactionCount: number;
};

export type CategoryBreakdownReportItem = ReportCategoryTotal & {
  percentage: number;
};

export type TopCategoryReportItem = ReportCategoryTotal;
