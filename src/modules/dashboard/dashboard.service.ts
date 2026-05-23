import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import {
  buildCursorPagination,
  CursorPaginationResult,
} from '../../common/utils/pagination.util';
import { TransactionType } from '../../generated/prisma/client';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { TopCategoriesQueryDto } from './dto/top-categories-query.dto';
import { TrendQueryDto } from './dto/trend-query.dto';
import {
  CashFlowItem,
  CategoryChartItem,
  RecentTransactionItem,
  TopCategoryItem,
  TrendItem,
} from './interfaces/chart-data.interface';
import { DashboardOverview } from './interfaces/dashboard-overview.interface';
import {
  DashboardQuery,
  DashboardTrendQuery,
  RecentTransactionsQuery,
  TopCategoriesQuery,
} from './interfaces/dashboard-query.interface';
import { DashboardMapper } from './mappers/dashboard.mapper';
import { DashboardQueryRepository } from './repositories/query.repository';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboardRepository: DashboardQueryRepository,
    private readonly dashboardMapper: DashboardMapper,
  ) {}

  async getOverview(
    userId: string,
    filter: DashboardFilterDto,
  ): Promise<DashboardOverview> {
    const query = this.toDashboardQuery(userId, filter);
    const [
      totalIncome,
      totalExpense,
      transactionCount,
      averageExpense,
      highestExpenseCategory,
      highestIncomeCategory,
    ] = await Promise.all([
      this.dashboardRepository.getTotalByType(query, TransactionType.INCOME),
      this.dashboardRepository.getTotalByType(query, TransactionType.EXPENSE),
      this.dashboardRepository.countTransactions(query),
      this.dashboardRepository.getAverageExpense(query),
      this.dashboardRepository.getHighestCategoryByType(
        query,
        TransactionType.EXPENSE,
      ),
      this.dashboardRepository.getHighestCategoryByType(
        query,
        TransactionType.INCOME,
      ),
    ]);

    return this.dashboardMapper.toOverview({
      totalIncome,
      totalExpense,
      transactionCount,
      averageExpense,
      highestExpenseCategory,
      highestIncomeCategory,
    });
  }

  async getExpenseByCategory(
    userId: string,
    filter: DashboardFilterDto,
  ): Promise<CategoryChartItem[]> {
    const totals = await this.dashboardRepository.getExpenseByCategory(
      this.toDashboardQuery(userId, filter),
    );

    return this.dashboardMapper.toCategoryChart(totals);
  }

  async getIncomeVsExpense(
    userId: string,
    queryDto: TrendQueryDto,
  ): Promise<TrendItem[]> {
    return this.dashboardMapper.toTrend(
      await this.dashboardRepository.getTrend(
        this.toTrendQuery(userId, queryDto),
      ),
    );
  }

  async getCashFlow(
    userId: string,
    queryDto: TrendQueryDto,
  ): Promise<CashFlowItem[]> {
    return this.dashboardMapper.toCashFlow(
      await this.dashboardRepository.getTrend(
        this.toTrendQuery(userId, queryDto),
      ),
    );
  }

  async getTopCategories(
    userId: string,
    queryDto: TopCategoriesQueryDto,
  ): Promise<TopCategoryItem[]> {
    const query: TopCategoriesQuery = {
      ...this.toDashboardQuery(userId, queryDto),
      limit: queryDto.limit ?? 5,
      type: queryDto.type ?? TransactionType.EXPENSE,
    };

    return this.dashboardMapper.toTopCategories(
      await this.dashboardRepository.getTopCategories(query),
    );
  }

  async getRecentTransactions(
    userId: string,
    queryDto: PaginationQueryDto,
  ): Promise<CursorPaginationResult<RecentTransactionItem>> {
    const query: RecentTransactionsQuery = {
      ...this.toDashboardQuery(userId, queryDto),
      limit: queryDto.limit,
      cursor: queryDto.cursor,
    };
    const items = await this.dashboardRepository.getRecentTransactions(query);

    return buildCursorPagination(items, queryDto.limit);
  }

  private toTrendQuery(
    userId: string,
    queryDto: TrendQueryDto,
  ): DashboardTrendQuery {
    return {
      ...this.toDashboardQuery(userId, queryDto),
      groupBy: queryDto.groupBy ?? 'month',
    };
  }

  private toDashboardQuery(
    userId: string,
    filter: DashboardFilterDto,
  ): DashboardQuery {
    return {
      userId,
      dateRange: this.toDateRange(filter),
      type: filter.type,
      categoryId: filter.categoryId,
    };
  }

  private toDateRange(filter: DashboardFilterDto) {
    if (filter.startDate || filter.endDate) {
      return {
        ...(filter.startDate
          ? { gte: this.parseDate(filter.startDate, false) }
          : {}),
        ...(filter.endDate
          ? { lte: this.parseDate(filter.endDate, true) }
          : {}),
      };
    }

    if (filter.month || filter.year) {
      const year = filter.year ?? new Date().getUTCFullYear();

      if (filter.month) {
        const start = new Date(Date.UTC(year, filter.month - 1, 1));
        const end = new Date(Date.UTC(year, filter.month, 1) - 1);

        return { gte: start, lte: end };
      }

      return {
        gte: new Date(Date.UTC(year, 0, 1)),
        lte: new Date(Date.UTC(year + 1, 0, 1) - 1),
      };
    }

    return undefined;
  }

  private parseDate(value: string, endOfDay: boolean): Date {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const date = new Date(
      endOfDay && dateOnlyPattern.test(value)
        ? `${value}T23:59:59.999Z`
        : value,
    );

    if (Number.isNaN(date.getTime())) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid dashboard date filter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return date;
  }
}
