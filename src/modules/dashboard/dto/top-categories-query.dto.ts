import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client';
import { DashboardFilterDto } from './dashboard-filter.dto';

export class TopCategoriesQueryDto extends DashboardFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 5;

  @IsOptional()
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.EXPENSE;
}
