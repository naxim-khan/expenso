import { ErrorCodes } from '../../common/constants/error-codes';
import { CategoryType } from '../../generated/prisma/client';
import { CategoriesService } from './categories.service';
import { CategoriesCommandRepository } from './repositories/command.repository';
import { CategoriesQueryRepository } from './repositories/query.repository';
import { CategoryResponse } from './repositories/category.select';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let commandRepository: jest.Mocked<
    Pick<CategoriesCommandRepository, 'create' | 'update' | 'delete'>
  >;
  let queryRepository: jest.Mocked<
    Pick<
      CategoriesQueryRepository,
      'findDuplicateByName' | 'findMany' | 'findById' | 'countTransactions'
    >
  >;

  const now = new Date('2026-05-23T00:00:00.000Z');
  const category: CategoryResponse = {
    id: 'category-1',
    name: 'Food',
    type: CategoryType.EXPENSE,
    isSystem: false,
    version: 1,
    userId: 'user-1',
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    commandRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    queryRepository = {
      findDuplicateByName: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      countTransactions: jest.fn(),
    };

    service = new CategoriesService(
      commandRepository as unknown as CategoriesCommandRepository,
      queryRepository as unknown as CategoriesQueryRepository,
    );
  });

  it('creates a user-scoped category after duplicate-name check', async () => {
    queryRepository.findDuplicateByName.mockResolvedValue(null);
    commandRepository.create.mockResolvedValue(category);

    await expect(
      service.create('user-1', {
        name: 'Food',
        type: CategoryType.EXPENSE,
      }),
    ).resolves.toEqual(category);

    expect(queryRepository.findDuplicateByName).toHaveBeenCalledWith(
      'user-1',
      'food',
      undefined,
    );
    expect(commandRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Food',
      normalizedName: 'food',
      type: CategoryType.EXPENSE,
    });
  });

  it('normalizes category names before duplicate checks and persistence', async () => {
    queryRepository.findDuplicateByName.mockResolvedValue(null);
    commandRepository.create.mockResolvedValue({
      ...category,
      name: 'FOOD Items',
    });

    await service.create('user-1', {
      name: '  FOOD   Items ',
      type: CategoryType.EXPENSE,
    });

    expect(queryRepository.findDuplicateByName).toHaveBeenCalledWith(
      'user-1',
      'food items',
      undefined,
    );
    expect(commandRepository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'FOOD Items',
      normalizedName: 'food items',
      type: CategoryType.EXPENSE,
    });
  });

  it('rejects duplicate category names per user', async () => {
    queryRepository.findDuplicateByName.mockResolvedValue({ id: 'category-1' });

    await expect(
      service.create('user-1', {
        name: 'Food',
        type: CategoryType.EXPENSE,
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.CATEGORY_ALREADY_EXISTS,
    });
  });

  it('rejects duplicate category names regardless of case', async () => {
    queryRepository.findDuplicateByName.mockResolvedValue({ id: 'category-1' });

    await expect(
      service.create('user-1', {
        name: ' food ',
        type: CategoryType.EXPENSE,
      }),
    ).rejects.toMatchObject({
      code: ErrorCodes.CATEGORY_ALREADY_EXISTS,
    });
    expect(queryRepository.findDuplicateByName).toHaveBeenCalledWith(
      'user-1',
      'food',
      undefined,
    );
  });

  it('returns cursor pagination metadata from repository items', async () => {
    queryRepository.findMany.mockResolvedValue([
      category,
      { ...category, id: 'category-2', name: 'Travel' },
      { ...category, id: 'category-3', name: 'Bills' },
    ]);

    const result = await service.findAll('user-1', {
      limit: 2,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({
      limit: 2,
      nextCursor: 'category-2',
      hasNext: true,
    });
    expect(queryRepository.findMany).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 2,
      cursor: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      type: undefined,
    });
  });

  it('throws when category is not found', async () => {
    queryRepository.findById.mockResolvedValue(null);

    await expect(service.findOne('user-1', 'missing')).rejects.toMatchObject({
      code: ErrorCodes.CATEGORY_NOT_FOUND,
    });
  });

  it('blocks hard delete when category has transactions', async () => {
    queryRepository.findById.mockResolvedValue(category);
    queryRepository.countTransactions.mockResolvedValue(1);

    await expect(service.remove('user-1', 'category-1')).rejects.toMatchObject({
      code: ErrorCodes.CATEGORY_IN_USE,
    });
    expect(commandRepository.delete).not.toHaveBeenCalled();
  });
});
