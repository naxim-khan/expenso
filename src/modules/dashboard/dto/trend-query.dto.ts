import { IsIn, IsOptional } from 'class-validator';
import { DashboardFilterDto } from './dashboard-filter.dto';
import type { DashboardGroupBy } from '../interfaces/dashboard-query.interface';

export class TrendQueryDto extends DashboardFilterDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy: DashboardGroupBy = 'month';
}
