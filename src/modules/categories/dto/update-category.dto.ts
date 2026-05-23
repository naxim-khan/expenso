import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { CategoryType } from '../../../generated/prisma/client';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
