import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { TransactionType } from '../../../generated/prisma/client';

export class CreateTransactionDto {
  @IsString()
  @MinLength(2)
  title: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  note?: string;

  @IsUUID()
  categoryId: string;
}
