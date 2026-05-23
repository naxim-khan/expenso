import { IsIn, IsOptional } from 'class-validator';
import { ReportsFilterDto } from './reports-filter.dto';
import type { ReportGroupBy } from '../interfaces/report-query.interface';

export class SpendingTrendDto extends ReportsFilterDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy: ReportGroupBy = 'month';
}
