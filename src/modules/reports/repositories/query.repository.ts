import { Injectable } from '@nestjs/common';
import {
  Prisma,
  TransactionType,
} from '../../../generated/prisma/client';
import { buildPrismaCursorQuery } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ReportCategoryTotal,
  ReportPeriodTotal,
  TransactionReportItem,
} from '../interfaces/report-chart.interface';
import {
  CategoryReportQuery,
  PeriodReportQuery,
  ReportQuery,
  TransactionsReportQuery,
} from '../interfaces/report-query.interface';
import { ReportSummaryAggregate } from '../interfaces/report-summary.interface';

type RawPeriodTotal = {
  period: Date | string;
  type: unknown;
  total: number | string | null;
};

type DateTruncUnit = 'day' | 'week' | 'month';

const transactionReportSelect = {
  id: true,
  title: true,
  amount: true,
  type: true,
  note: true,
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
export class ReportsQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummaryAggregates(
    query: ReportQuery,
  ): Promise<ReportSummaryAggregate[]> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: this.buildWhere(query),
      _sum: { amount: true },
      _avg: { amount: true },
      _max: { amount: true },
      _count: { id: true },
    });

    return rows.map((row) => ({
      type: row.type,
      total: row._sum.amount ?? 0,
      average: row._avg.amount ?? 0,
      highest: row._max.amount ?? 0,
      count: row._count.id,
    }));
  }

  getTransactions(
    query: TransactionsReportQuery,
  ): Promise<TransactionReportItem[]> {
    return this.prisma.transaction.findMany({
      where: this.buildWhere(query),
      select: transactionReportSelect,
      ...buildPrismaCursorQuery({
        limit: query.limit,
        cursor: query.cursor,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }),
    });
  }

  async getPeriodTotals(
    query: PeriodReportQuery,
  ): Promise<ReportPeriodTotal[]> {
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

  async getCategoryTotals(
    query: CategoryReportQuery,
  ): Promise<ReportCategoryTotal[]> {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: this.buildWhere(query),
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: 'desc' } },
      ...(query.limit ? { take: query.limit } : {}),
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

  countTransactions(query: ReportQuery): Promise<number> {
    return this.prisma.transaction.count({
      where: this.buildWhere(query),
    });
  }

  private buildWhere(query: ReportQuery): Prisma.TransactionWhereInput {
    const transactionQuery = query as Partial<TransactionsReportQuery>;

    return {
      userId: query.userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.dateRange
        ? {
            createdAt: {
              ...(query.dateRange.gte ? { gte: query.dateRange.gte } : {}),
              ...(query.dateRange.lte ? { lte: query.dateRange.lte } : {}),
            },
          }
        : {}),
      ...(transactionQuery.amountRange
        ? {
            amount: {
              ...(transactionQuery.amountRange.gte !== undefined
                ? { gte: transactionQuery.amountRange.gte }
                : {}),
              ...(transactionQuery.amountRange.lte !== undefined
                ? { lte: transactionQuery.amountRange.lte }
                : {}),
            },
          }
        : {}),
      ...(transactionQuery.search
        ? {
            OR: [
              {
                title: {
                  contains: transactionQuery.search,
                  mode: 'insensitive',
                },
              },
              {
                note: {
                  contains: transactionQuery.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
  }

  private toRawFilterSql(query: ReportQuery): Prisma.Sql {
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

  private toDateTruncUnit(groupBy: PeriodReportQuery['groupBy']): DateTruncUnit {
    const units: Record<PeriodReportQuery['groupBy'], DateTruncUnit> = {
      day: 'day',
      week: 'week',
      month: 'month',
    };

    return units[groupBy];
  }

  private toPeriodTotal(
    row: RawPeriodTotal,
    groupBy: PeriodReportQuery['groupBy'],
  ): ReportPeriodTotal {
    return {
      period: this.formatPeriod(this.toDate(row.period), groupBy),
      type: this.toTransactionType(row.type),
      total: Number(row.total ?? 0),
    };
  }

  private toDate(value: Date | string): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new Error('Report period query returned an invalid period');
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

    throw new Error('Report period query returned an invalid type');
  }

  private formatPeriod(
    period: Date,
    groupBy: PeriodReportQuery['groupBy'],
  ): string {
    const iso = period.toISOString();

    if (groupBy === 'month') {
      return iso.slice(0, 7);
    }

    return iso.slice(0, 10);
  }
}
