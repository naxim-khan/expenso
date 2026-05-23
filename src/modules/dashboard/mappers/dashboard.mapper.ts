import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../../generated/prisma/client';
import {
  CashFlowItem,
  CategoryChartItem,
  TopCategoryItem,
  TrendItem,
} from '../interfaces/chart-data.interface';
import {
  DashboardCategoryTotal,
  DashboardOverview,
} from '../interfaces/dashboard-overview.interface';

type CategoryTotalInput = {
  categoryId: string;
  categoryName: string;
  total: number;
};

type CategoryCountInput = CategoryTotalInput & {
  transactionCount: number;
};

type PeriodTotalInput = {
  period: string;
  type: TransactionType;
  total: number;
};

@Injectable()
export class DashboardMapper {
  toOverview(input: {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    averageExpense: number;
    highestExpenseCategory: DashboardCategoryTotal | null;
    highestIncomeCategory: DashboardCategoryTotal | null;
  }): DashboardOverview {
    const netBalance = input.totalIncome - input.totalExpense;
    const savingsRate =
      input.totalIncome > 0 ? (netBalance / input.totalIncome) * 100 : 0;

    return {
      totalIncome: input.totalIncome,
      totalExpense: input.totalExpense,
      netBalance,
      savingsRate,
      transactionCount: input.transactionCount,
      averageExpense: input.averageExpense,
      highestExpenseCategory: input.highestExpenseCategory,
      highestIncomeCategory: input.highestIncomeCategory,
    };
  }

  toCategoryChart(items: CategoryTotalInput[]): CategoryChartItem[] {
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    return items.map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
    }));
  }

  toTopCategories(items: CategoryCountInput[]): TopCategoryItem[] {
    return items.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      total: item.total,
      transactionCount: item.transactionCount,
    }));
  }

  toTrend(items: PeriodTotalInput[]): TrendItem[] {
    return this.toPeriodMap(items).map(({ period, income, expense }) => ({
      period,
      income,
      expense,
    }));
  }

  toCashFlow(items: PeriodTotalInput[]): CashFlowItem[] {
    let balance = 0;

    return this.toPeriodMap(items).map(({ period, income, expense }) => {
      balance += income - expense;

      return {
        period,
        income,
        expense,
        balance,
      };
    });
  }

  private toPeriodMap(items: PeriodTotalInput[]) {
    const periods = new Map<string, { income: number; expense: number }>();

    for (const item of items) {
      const current = periods.get(item.period) ?? { income: 0, expense: 0 };

      if (item.type === TransactionType.INCOME) {
        current.income += item.total;
      } else {
        current.expense += item.total;
      }

      periods.set(item.period, current);
    }

    return Array.from(periods.entries()).map(([period, totals]) => ({
      period,
      ...totals,
    }));
  }
}
