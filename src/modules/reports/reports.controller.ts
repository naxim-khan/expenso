import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CashflowReportDto } from './dto/cashflow-report.dto';
import { CategoryReportDto } from './dto/category-report.dto';
import { ExportReportDto } from './dto/export-report.dto';
import { ReportPaginationDto } from './dto/report-pagination.dto';
import { ReportsFilterDto } from './dto/reports-filter.dto';
import { SpendingTrendDto } from './dto/spending-trend.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ResponseMessage('Financial summary report retrieved successfully')
  getSummary(
    @Req() request: AuthenticatedRequest,
    @Query() query: ReportsFilterDto,
  ) {
    return this.reportsService.getSummary(request.user.userId, query);
  }

  @Get('transactions')
  @ResponseMessage('Transactions report retrieved successfully')
  getTransactions(
    @Req() request: AuthenticatedRequest,
    @Query() query: ReportPaginationDto,
  ) {
    return this.reportsService.getTransactions(request.user.userId, query);
  }

  @Get('spending-trends')
  @ResponseMessage('Spending trend report retrieved successfully')
  getSpendingTrends(
    @Req() request: AuthenticatedRequest,
    @Query() query: SpendingTrendDto,
  ) {
    return this.reportsService.getSpendingTrends(request.user.userId, query);
  }

  @Get('category-breakdown')
  @ResponseMessage('Category breakdown report retrieved successfully')
  getCategoryBreakdown(
    @Req() request: AuthenticatedRequest,
    @Query() query: CategoryReportDto,
  ) {
    return this.reportsService.getCategoryBreakdown(request.user.userId, query);
  }

  @Get('monthly')
  @ResponseMessage('Monthly financial report retrieved successfully')
  getMonthly(
    @Req() request: AuthenticatedRequest,
    @Query() query: ReportsFilterDto,
  ) {
    return this.reportsService.getMonthly(request.user.userId, query);
  }

  @Get('cash-flow')
  @ResponseMessage('Cash flow report retrieved successfully')
  getCashFlow(
    @Req() request: AuthenticatedRequest,
    @Query() query: CashflowReportDto,
  ) {
    return this.reportsService.getCashFlow(request.user.userId, query);
  }

  @Get('top-categories')
  @ResponseMessage('Top categories report retrieved successfully')
  getTopCategories(
    @Req() request: AuthenticatedRequest,
    @Query() query: CategoryReportDto,
  ) {
    return this.reportsService.getTopCategories(request.user.userId, query);
  }

  @Get('export-preview')
  @ResponseMessage('Report export preview retrieved successfully')
  getExportPreview(
    @Req() request: AuthenticatedRequest,
    @Query() query: ExportReportDto,
  ) {
    return this.reportsService.getExportPreview(request.user.userId, query);
  }
}
