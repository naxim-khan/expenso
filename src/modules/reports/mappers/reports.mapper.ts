import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../../generated/prisma/client';
import {
  CashFlowReportItem,
  CategoryBreakdownReportItem,
  MonthlyFinancialReportItem,
  ReportCategoryTotal,
  ReportPeriodTotal,
  SpendingTrendReportItem,
  TopCategoryReportItem,
} from '../interfaces/report-chart.interface';
import {
  ExportReportPreview,
  FinancialSummaryReport,
  ReportFilterSnapshot,
  ReportSummaryAggregate,
} from '../interfaces/report-summary.interface';

type PeriodTotals = {
  period: string;
  income: number;
  expense: number;
};

@Injectable()
export class ReportsMapper {
  toFinancialSummary(
    aggregates: ReportSummaryAggregate[],
  ): FinancialSummaryReport {
    const income = this.findAggregate(aggregates, TransactionType.INCOME);
    const expense = this.findAggregate(aggregates, TransactionType.EXPENSE);
    const totalIncome = income.total;
    const totalExpense = expense.total;
    const netBalance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate: totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0,
      totalTransactions: income.count + expense.count,
      averageIncome: income.average,
      averageExpense: expense.average,
      highestExpense: expense.highest,
      highestIncome: income.highest,
    };
  }

  toSpendingTrend(items: ReportPeriodTotal[]): SpendingTrendReportItem[] {
    return this.toPeriodTotals(items).map(({ period, income, expense }) => ({
      period,
      income,
      expense,
      balance: income - expense,
    }));
  }

  toMonthlyReports(items: ReportPeriodTotal[]): MonthlyFinancialReportItem[] {
    return this.toPeriodTotals(items).map(({ period, income, expense }) => {
      const balance = income - expense;

      return {
        month: period,
        income,
        expense,
        balance,
        savingsRate: income > 0 ? (balance / income) * 100 : 0,
      };
    });
  }

  toCashFlow(items: ReportPeriodTotal[]): CashFlowReportItem[] {
    let runningBalance = 0;

    return this.toPeriodTotals(items).map(({ period, income, expense }) => {
      runningBalance += income - expense;

      return {
        period,
        income,
        expense,
        runningBalance,
      };
    });
  }

  toCategoryBreakdown(
    items: ReportCategoryTotal[],
  ): CategoryBreakdownReportItem[] {
    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    return items.map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
    }));
  }

  toTopCategories(items: ReportCategoryTotal[]): TopCategoryReportItem[] {
    return items.map((item) => ({
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      total: item.total,
      transactionCount: item.transactionCount,
    }));
  }

  toExportPreview(input: {
    summary: FinancialSummaryReport;
    filters: ReportFilterSnapshot;
    transactionCount: number;
  }): ExportReportPreview {
    return {
      summary: input.summary,
      filters: input.filters,
      generatedAt: new Date().toISOString(),
      transactionCount: input.transactionCount,
    };
  }

  private findAggregate(
    aggregates: ReportSummaryAggregate[],
    type: TransactionType,
  ): Omit<ReportSummaryAggregate, 'type'> {
    const aggregate = aggregates.find((item) => item.type === type);

    return {
      total: aggregate?.total ?? 0,
      average: aggregate?.average ?? 0,
      highest: aggregate?.highest ?? 0,
      count: aggregate?.count ?? 0,
    };
  }

  private toPeriodTotals(items: ReportPeriodTotal[]): PeriodTotals[] {
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
