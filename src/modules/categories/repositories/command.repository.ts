import { Injectable } from '@nestjs/common';
import { CategoryType } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DEFAULT_CATEGORIES } from '../constants/default-categories';
import { normalizeCategoryName } from '../domain/category-name.util';
import { categorySelect, CategoryResponse } from './category.select';

export type CategoryCommandClient = Pick<PrismaService, 'category'>;

type CategoryCreateData = {
  userId: string;
  name: string;
  normalizedName: string;
  type: CategoryType;
};

type CategoryUpdateData = {
  name?: string;
  normalizedName?: string;
  type?: CategoryType;
};

@Injectable()
export class CategoriesCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  createDefaultCategories(
    userId: string,
    client: CategoryCommandClient = this.prisma,
  ): Promise<{ count: number }> {
    return client.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        normalizedName: normalizeCategoryName(category.name),
        userId,
      })),
    });
  }

  create(data: CategoryCreateData): Promise<CategoryResponse> {
    return this.prisma.category.create({
      data,
      select: categorySelect,
    });
  }

  update(
    userId: string,
    id: string,
    data: CategoryUpdateData,
  ): Promise<CategoryResponse> {
    return this.prisma.category.update({
      where: { id, userId },
      data,
      select: categorySelect,
    });
  }

  delete(userId: string, id: string): Promise<CategoryResponse> {
    return this.prisma.category.delete({
      where: { id, userId },
      select: categorySelect,
    });
  }
}
