import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import {
  buildCursorPagination,
  CursorPaginationResult,
} from '../../common/utils/pagination.util';
import { TransactionType } from '../../generated/prisma/client';
import { CashflowReportDto } from './dto/cashflow-report.dto';
import { CategoryReportDto } from './dto/category-report.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { ReportPaginationDto } from './dto/report-pagination.dto';
import { ReportsFilterDto } from './dto/reports-filter.dto';
import { SpendingTrendDto } from './dto/spending-trend.dto';
import {
  CashFlowReportItem,
  CategoryBreakdownReportItem,
  MonthlyFinancialReportItem,
  SpendingTrendReportItem,
  TopCategoryReportItem,
  TransactionReportItem,
} from './interfaces/report-chart.interface';
import {
  CategoryReportQuery,
  PeriodReportQuery,
  ReportAmountRange,
  ReportDateRange,
  ReportQuery,
  TransactionsReportQuery,
} from './interfaces/report-query.interface';
import {
  ExportReportPreview,
  FinancialSummaryReport,
  ReportFilterSnapshot,
} from './interfaces/report-summary.interface';
import { ReportsMapper } from './mappers/reports.mapper';
import { ReportsQueryRepository } from './repositories/query.repository';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsQueryRepository,
    private readonly reportsMapper: ReportsMapper,
  ) {}

  async getSummary(
    userId: string,
    filter: ReportsFilterDto,
  ): Promise<FinancialSummaryReport> {
    const aggregates = await this.reportsRepository.getSummaryAggregates(
      this.toReportQuery(userId, filter),
    );

    return this.reportsMapper.toFinancialSummary(aggregates);
  }

  async getTransactions(
    userId: string,
    queryDto: ReportPaginationDto,
  ): Promise<CursorPaginationResult<TransactionReportItem>> {
    const query = this.toTransactionsQuery(userId, queryDto);
    const items = await this.reportsRepository.getTransactions(query);

    return buildCursorPagination(items, query.limit);
  }

  async getSpendingTrends(
    userId: string,
    queryDto: SpendingTrendDto,
  ): Promise<SpendingTrendReportItem[]> {
    return this.reportsMapper.toSpendingTrend(
      await this.reportsRepository.getPeriodTotals(
        this.toPeriodQuery(userId, queryDto),
      ),
    );
  }

  async getCategoryBreakdown(
    userId: string,
    queryDto: CategoryReportDto,
  ): Promise<CategoryBreakdownReportItem[]> {
    return this.reportsMapper.toCategoryBreakdown(
      await this.reportsRepository.getCategoryTotals(
        this.toCategoryQuery(userId, queryDto),
      ),
    );
  }

  async getMonthly(
    userId: string,
    filter: ReportsFilterDto,
  ): Promise<MonthlyFinancialReportItem[]> {
    return this.reportsMapper.toMonthlyReports(
      await this.reportsRepository.getPeriodTotals({
        ...this.toReportQuery(userId, filter),
        groupBy: 'month',
      }),
    );
  }

  async getCashFlow(
    userId: string,
    queryDto: CashflowReportDto,
  ): Promise<CashFlowReportItem[]> {
    return this.reportsMapper.toCashFlow(
      await this.reportsRepository.getPeriodTotals(
        this.toPeriodQuery(userId, queryDto),
      ),
    );
  }

  async getTopCategories(
    userId: string,
    queryDto: CategoryReportDto,
  ): Promise<TopCategoryReportItem[]> {
    return this.reportsMapper.toTopCategories(
      await this.reportsRepository.getCategoryTotals(
        this.toCategoryQuery(userId, {
          ...queryDto,
          limit: queryDto.limit ?? 10,
        }),
      ),
    );
  }

  async getExportPreview(
    userId: string,
    filter: ExportReportDto,
  ): Promise<ExportReportPreview> {
    const query = this.toReportQuery(userId, filter);
    const [aggregates, transactionCount] = await Promise.all([
      this.reportsRepository.getSummaryAggregates(query),
      this.reportsRepository.countTransactions(query),
    ]);
    const summary = this.reportsMapper.toFinancialSummary(aggregates);

    return this.reportsMapper.toExportPreview({
      summary,
      filters: this.toFilterSnapshot(filter),
      transactionCount,
    });
  }

  private toTransactionsQuery(
    userId: string,
    queryDto: ReportPaginationDto,
  ): TransactionsReportQuery {
    return {
      ...this.toReportQuery(userId, queryDto),
      limit: queryDto.limit,
      cursor: queryDto.cursor,
      sortBy: queryDto.sortBy ?? 'createdAt',
      sortOrder: queryDto.sortOrder ?? 'desc',
      amountRange: this.toAmountRange(queryDto),
      search: this.normalizeSearch(queryDto.search),
    };
  }

  private toPeriodQuery(
    userId: string,
    queryDto: SpendingTrendDto,
  ): PeriodReportQuery {
    return {
      ...this.toReportQuery(userId, queryDto),
      groupBy: queryDto.groupBy ?? 'month',
    };
  }

  private toCategoryQuery(
    userId: string,
    queryDto: CategoryReportDto,
  ): CategoryReportQuery {
    return {
      ...this.toReportQuery(userId, queryDto),
      type: queryDto.type ?? TransactionType.EXPENSE,
      limit: queryDto.limit,
    };
  }

  private toReportQuery(userId: string, filter: ReportsFilterDto): ReportQuery {
    return {
      userId,
      dateRange: this.toDateRange(filter),
      type: filter.type,
      categoryId: filter.categoryId,
    };
  }

  private toDateRange(filter: ReportsFilterDto): ReportDateRange | undefined {
    if (filter.startDate || filter.endDate) {
      const range = {
        ...(filter.startDate
          ? { gte: this.parseDate(filter.startDate, false) }
          : {}),
        ...(filter.endDate
          ? { lte: this.parseDate(filter.endDate, true) }
          : {}),
      };

      this.ensureDateRangeOrder(range);

      return range;
    }

    if (filter.month || filter.year) {
      const year = filter.year ?? new Date().getUTCFullYear();

      if (filter.month) {
        return {
          gte: new Date(Date.UTC(year, filter.month - 1, 1)),
          lte: new Date(Date.UTC(year, filter.month, 1) - 1),
        };
      }

      return {
        gte: new Date(Date.UTC(year, 0, 1)),
        lte: new Date(Date.UTC(year + 1, 0, 1) - 1),
      };
    }

    return undefined;
  }

  private toAmountRange(
    queryDto: ReportPaginationDto,
  ): ReportAmountRange | undefined {
    if (queryDto.minAmount === undefined && queryDto.maxAmount === undefined) {
      return undefined;
    }

    if (
      queryDto.minAmount !== undefined &&
      queryDto.maxAmount !== undefined &&
      queryDto.minAmount > queryDto.maxAmount
    ) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        'minAmount must be less than or equal to maxAmount',
        HttpStatus.BAD_REQUEST,
      );
    }

    return {
      ...(queryDto.minAmount !== undefined ? { gte: queryDto.minAmount } : {}),
      ...(queryDto.maxAmount !== undefined ? { lte: queryDto.maxAmount } : {}),
    };
  }

  private normalizeSearch(search?: string): string | undefined {
    const normalized = search?.trim();

    return normalized ? normalized : undefined;
  }

  private parseDate(value: string, endOfDay: boolean): Date {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    const date = new Date(
      dateOnlyPattern.test(value)
        ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
        : value,
    );

    if (Number.isNaN(date.getTime())) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid report date filter',
        HttpStatus.BAD_REQUEST,
      );
    }

    return date;
  }

  private ensureDateRangeOrder(range: ReportDateRange) {
    if (range.gte && range.lte && range.gte.getTime() > range.lte.getTime()) {
      throw new AppException(
        ErrorCodes.VALIDATION_ERROR,
        'startDate must be less than or equal to endDate',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private toFilterSnapshot(filter: ReportsFilterDto): ReportFilterSnapshot {
    return {
      startDate: filter.startDate,
      endDate: filter.endDate,
      month: filter.month,
      year: filter.year,
      type: filter.type,
      categoryId: filter.categoryId,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder,
    };
  }
}
