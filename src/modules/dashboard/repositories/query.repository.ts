import { Injectable } from '@nestjs/common';
import {
  CategoryType,
  Prisma,
  TransactionType,
} from '../../../generated/prisma/client';
import { buildPrismaCursorQuery } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  RecentTransactionItem,
  TopCategoryItem,
} from '../interfaces/chart-data.interface';
import {
  DashboardCategoryTotal,
} from '../interfaces/dashboard-overview.interface';
import {
  DashboardQuery,
  DashboardTrendQuery,
  RecentTransactionsQuery,
  TopCategoriesQuery,
} from '../interfaces/dashboard-query.interface';

type CategoryTotal = DashboardCategoryTotal & {
  transactionCount: number;
};

type PeriodTotal = {
  period: string;
  type: TransactionType;
  total: number;
};

type RawPeriodTotal = {
  period: Date | string;
  type: unknown;
  total: number | string | null;
};

type DateTruncUnit = 'day' | 'week' | 'month';

const recentTransactionSelect = {
  id: true,
  title: true,
  amount: true,
  type: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
} as const;

@Injectable()
export class DashboardQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalByType(
    query: DashboardQuery,
    type: TransactionType,
  ): Promise<number> {
    if (query.type && query.type !== type) {
      return 0;
    }

    const result = await this.prisma.transaction.aggregate({
      where: this.buildWhere(query, type),
      _sum: { amount: true },
    });

    return result._sum.amount ?? 0;
  }

  async countTransactions(query: DashboardQuery): Promise<number> {
    return this.prisma.transaction.count({
      where: this.buildWhere(query),
    });
  }

  async getAverageExpense(query: DashboardQuery): Promise<number> {
    if (query.type === TransactionType.INCOME) {
      return 0;
    }

    const result = await this.prisma.transaction.aggregate({
      where: this.buildWhere(query, TransactionType.EXPENSE),
      _avg: { amount: true },
    });

    return result._avg.amount ?? 0;
  }

  async getHighestCategoryByType(
    query: DashboardQuery,
    type: TransactionType,
  ): Promise<DashboardCategoryTotal | null> {
    const [categoryTotal] = await this.getCategoryTotals(query, type, 1);

    return categoryTotal
      ? {
          categoryId: categoryTotal.categoryId,
          categoryName: categoryTotal.categoryName,
          total: categoryTotal.total,
        }
      : null;
  }

  getExpenseByCategory(query: DashboardQuery): Promise<CategoryTotal[]> {
    return this.getCategoryTotals(query, TransactionType.EXPENSE);
  }

  getTopCategories(query: TopCategoriesQuery): Promise<TopCategoryItem[]> {
    return this.getCategoryTotals(query, query.type, query.limit);
  }

  async getTrend(query: DashboardTrendQuery): Promise<PeriodTotal[]> {
    const rows = await this.prisma.$queryRaw<RawPeriodTotal[]>`
      SELECT
        date_trunc(${this.toDateTruncUnit(query.groupBy)}, "createdAt") AS period,
        "type",
        SUM("amount") AS total
      FROM "Transaction"
      WHERE "userId" = ${query.userId}
        ${this.toRawFilterSql(query)}
      GROUP BY period, "type"
      ORDER BY period ASC
    `;

    return rows.map((row) => this.toPeriodTotal(row, query.groupBy));
  }

  getRecentTransactions(
    query: RecentTransactionsQuery,
  ): Promise<RecentTransactionItem[]> {
    return this.prisma.transaction.findMany({
      where: this.buildWhere(query),
      select: recentTransactionSelect,
      ...buildPrismaCursorQuery({
        limit: query.limit,
        cursor: query.cursor,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    });
  }

  private async getCategoryTotals(
    query: DashboardQuery,
    type: TransactionType,
    take?: number,
  ): Promise<CategoryTotal[]> {
    if (query.type && query.type !== type) {
      return [];
    }

    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: this.buildWhere(query, type),
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      ...(take ? { take } : {}),
    });
    const categoryIds = grouped.map((item) => item.categoryId);

    if (categoryIds.length === 0) {
      return [];
    }

    const categories = await this.prisma.category.findMany({
      where: {
        userId: query.userId,
        id: { in: categoryIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const categoryNames = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return grouped.map((item) => ({
      categoryId: item.categoryId,
      categoryName: categoryNames.get(item.categoryId) ?? 'Unknown',
      total: item._sum.amount ?? 0,
      transactionCount: item._count.id,
    }));
  }

  private buildWhere(
    query: DashboardQuery,
    overrideType?: TransactionType,
  ): Prisma.TransactionWhereInput {
    return {
      userId: query.userId,
      ...(overrideType || query.type ? { type: overrideType ?? query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.dateRange
        ? {
            createdAt: {
              ...(query.dateRange.gte ? { gte: query.dateRange.gte } : {}),
              ...(query.dateRange.lte ? { lte: query.dateRange.lte } : {}),
            },
          }
        : {}),
    };
  }

  private toRawFilterSql(query: DashboardQuery): Prisma.Sql {
    return Prisma.sql`
      ${query.type ? Prisma.sql`AND "type" = ${query.type}` : Prisma.empty}
      ${
        query.categoryId
          ? Prisma.sql`AND "categoryId" = ${query.categoryId}`
          : Prisma.empty
      }
      ${
        query.dateRange?.gte
          ? Prisma.sql`AND "createdAt" >= ${query.dateRange.gte}`
          : Prisma.empty
      }
      ${
        query.dateRange?.lte
          ? Prisma.sql`AND "createdAt" <= ${query.dateRange.lte}`
          : Prisma.empty
      }
    `;
  }

  private toDateTruncUnit(
    groupBy: DashboardTrendQuery['groupBy'],
  ): DateTruncUnit {
    const units: Record<DashboardTrendQuery['groupBy'], DateTruncUnit> = {
      day: 'day',
      week: 'week',
      month: 'month',
    };

    return units[groupBy];
  }

  private toPeriodTotal(
    row: RawPeriodTotal,
    groupBy: DashboardTrendQuery['groupBy'],
  ): PeriodTotal {
    return {
      period: this.formatPeriod(this.toDate(row.period), groupBy),
      type: this.toTransactionType(row.type),
      total: Number(row.total ?? 0),
    };
  }

  private toDate(value: Date | string): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error('Dashboard period query returned an invalid period');
    }

    return date;
  }

  private toTransactionType(value: unknown): TransactionType {
    if (
      value === TransactionType.INCOME ||
      value === TransactionType.EXPENSE
    ) {
      return value;
    }

    throw new Error('Dashboard period query returned an invalid type');
  }

  private formatPeriod(
    period: Date,
    groupBy: DashboardTrendQuery['groupBy'],
  ): string {
    const iso = period.toISOString();

    if (groupBy === 'day') {
      return iso.slice(0, 10);
    }

    if (groupBy === 'month') {
      return iso.slice(0, 7);
    }

    return iso.slice(0, 10);
  }
}
