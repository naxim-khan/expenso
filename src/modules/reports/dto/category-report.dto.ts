import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client';
import { ReportsFilterDto } from './reports-filter.dto';

export class CategoryReportDto extends ReportsFilterDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.EXPENSE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
