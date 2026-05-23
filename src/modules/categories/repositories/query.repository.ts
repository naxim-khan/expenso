import { Injectable } from '@nestjs/common';
import { CategoryType } from '../../../generated/prisma/client';
import { buildPrismaCursorQuery } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { categorySelect, CategoryResponse } from './category.select';

type ListCategoriesOptions = {
  userId: string;
  limit?: number;
  cursor?: string;
  sortBy: 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  type?: CategoryType;
};

@Injectable()
export class CategoriesQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDuplicateByName(
    userId: string,
    normalizedName: string,
    excludeId?: string,
  ) {
    return this.prisma.category.findFirst({
      where: {
        userId,
        normalizedName,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
  }

  findMany({
    userId,
    limit,
    cursor,
    sortBy,
    sortOrder,
    type,
  }: ListCategoriesOptions): Promise<CategoryResponse[]> {
    return this.prisma.category.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      select: categorySelect,
      ...buildPrismaCursorQuery({ limit, cursor, sortBy, sortOrder }),
    });
  }

  findById(userId: string, id: string): Promise<CategoryResponse | null> {
    return this.prisma.category.findFirst({
      where: { id, userId },
      select: categorySelect,
    });
  }

  countTransactions(userId: string, categoryId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: { userId, categoryId },
    });
  }
}
