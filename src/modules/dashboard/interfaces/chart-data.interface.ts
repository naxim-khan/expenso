import {
  CategoryType,
  TransactionType,
} from '../../../generated/prisma/client';

export type CategoryChartItem = {
  categoryId: string;
  categoryName: string;
  total: number;
  percentage: number;
};

export type TrendItem = {
  period: string;
  income: number;
  expense: number;
};

export type CashFlowItem = TrendItem & {
  balance: number;
};

export type TopCategoryItem = {
  categoryId: string;
  categoryName: string;
  total: number;
  transactionCount: number;
};

export type RecentTransactionItem = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    type: CategoryType;
  };
};
