import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { TopCategoriesQueryDto } from './dto/top-categories-query.dto';
import { TrendQueryDto } from './dto/trend-query.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ResponseMessage('Dashboard overview retrieved successfully')
  getOverview(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardFilterDto,
  ) {
    return this.dashboardService.getOverview(request.user.userId, query);
  }

  @Get('expense-by-category')
  @ResponseMessage('Expense by category retrieved successfully')
  getExpenseByCategory(
    @Req() request: AuthenticatedRequest,
    @Query() query: DashboardFilterDto,
  ) {
    return this.dashboardService.getExpenseByCategory(
      request.user.userId,
      query,
    );
  }

  @Get('income-vs-expense')
  @ResponseMessage('Income vs expense trend retrieved successfully')
  getIncomeVsExpense(
    @Req() request: AuthenticatedRequest,
    @Query() query: TrendQueryDto,
  ) {
    return this.dashboardService.getIncomeVsExpense(request.user.userId, query);
  }

  @Get('cash-flow')
  @ResponseMessage('Cash flow retrieved successfully')
  getCashFlow(
    @Req() request: AuthenticatedRequest,
    @Query() query: TrendQueryDto,
  ) {
    return this.dashboardService.getCashFlow(request.user.userId, query);
  }

  @Get('top-categories')
  @ResponseMessage('Top categories retrieved successfully')
  getTopCategories(
    @Req() request: AuthenticatedRequest,
    @Query() query: TopCategoriesQueryDto,
  ) {
    return this.dashboardService.getTopCategories(request.user.userId, query);
  }

  @Get('recent-transactions')
  @ResponseMessage('Recent transactions retrieved successfully')
  getRecentTransactions(
    @Req() request: AuthenticatedRequest,
    @Query() query: PaginationQueryDto,
  ) {
    return this.dashboardService.getRecentTransactions(
      request.user.userId,
      query,
    );
  }
}
