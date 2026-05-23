import { TransactionType } from '../../../generated/prisma/client';

export type ReportSummaryAggregate = {
  type: TransactionType;
  total: number;
  average: number;
  highest: number;
  count: number;
};

export type FinancialSummaryReport = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  totalTransactions: number;
  averageIncome: number;
  averageExpense: number;
  highestExpense: number;
  highestIncome: number;
};

export type ReportFilterSnapshot = {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  type?: string;
  categoryId?: string;
  sortBy?: string;
  sortOrder?: string;
};

export type ExportReportPreview = {
  summary: FinancialSummaryReport;
  filters: ReportFilterSnapshot;
  generatedAt: string;
  transactionCount: number;
};
