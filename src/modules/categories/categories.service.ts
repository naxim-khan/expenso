import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import {
  buildCursorPagination,
  CursorPaginationResult,
} from '../../common/utils/pagination.util';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  assertCategoryCanBeDeleted,
  assertCategoryNameIsAvailable,
} from './domain/category.rules';
import {
  formatCategoryName,
  normalizeCategoryName,
} from './domain/category-name.util';
import { ListCategoriesDto } from './dto/list-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesCommandRepository } from './repositories/command.repository';
import { CategoriesQueryRepository } from './repositories/query.repository';
import { CategoryResponse } from './repositories/category.select';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly commandRepository: CategoriesCommandRepository,
    private readonly queryRepository: CategoriesQueryRepository,
  ) {}

  async create(
    userId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryResponse> {
    const name = formatCategoryName(dto.name);
    const normalizedName = normalizeCategoryName(dto.name);

    await this.ensureNameIsAvailable(userId, normalizedName);

    return this.commandRepository.create({
      userId,
      name,
      normalizedName,
      type: dto.type,
    });
  }

  async findAll(
    userId: string,
    query: ListCategoriesDto,
  ): Promise<CursorPaginationResult<CategoryResponse>> {
    const items = await this.queryRepository.findMany({
      userId,
      limit: query.limit,
      cursor: query.cursor,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      type: query.type,
    });

    return buildCursorPagination(items, query.limit);
  }

  async findOne(userId: string, id: string): Promise<CategoryResponse> {
    const category = await this.queryRepository.findById(userId, id);

    if (!category) {
      throw this.notFound();
    }

    return category;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponse> {
    await this.findOne(userId, id);

    const data = { ...dto };

    if (dto.name) {
      data.name = formatCategoryName(dto.name);
      const normalizedName = normalizeCategoryName(dto.name);

      await this.ensureNameIsAvailable(userId, normalizedName, id);

      return this.commandRepository.update(userId, id, {
        ...data,
        normalizedName,
      });
    }

    return this.commandRepository.update(userId, id, data);
  }

  async remove(userId: string, id: string): Promise<CategoryResponse> {
    await this.findOne(userId, id);

    const transactionCount = await this.queryRepository.countTransactions(
      userId,
      id,
    );

    assertCategoryCanBeDeleted(transactionCount);

    return this.commandRepository.delete(userId, id);
  }

  private async ensureNameIsAvailable(
    userId: string,
    normalizedName: string,
    excludeId?: string,
  ) {
    const duplicate = await this.queryRepository.findDuplicateByName(
      userId,
      normalizedName,
      excludeId,
    );

    assertCategoryNameIsAvailable(duplicate);
  }

  private notFound(): AppException {
    return new AppException(
      ErrorCodes.CATEGORY_NOT_FOUND,
      'Category not found',
      HttpStatus.NOT_FOUND,
    );
  }
}
