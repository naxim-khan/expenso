import { ErrorCodes } from '../../common/constants/error-codes';
import { CategoryType, TransactionType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';
import {
  TransactionCommandClient,
  TransactionsCommandRepository,
} from './repositories/command.repository';
import {
  TransactionQueryClient,
  TransactionsQueryRepository,
} from './repositories/query.repository';
import { TransactionResponse } from './repositories/transaction.select';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: { $transaction: jest.Mock };
  let commandRepository: jest.Mocked<
    Pick<TransactionsCommandRepository, 'create' | 'update' | 'delete'>
  >;
  let queryRepository: jest.Mocked<
    Pick<
      TransactionsQueryRepository,
      'findCategoryById' | 'findMany' | 'findById'
    >
  >;

  const tx = {} as TransactionCommandClient & TransactionQueryClient;
  const now = new Date('2026-05-23T00:00:00.000Z');
  const transaction: TransactionResponse = {
    id: 'transaction-1',
    title: 'Lunch',
    amount: 25,
    type: TransactionType.EXPENSE,
    note: null,
    userId: 'user-1',
    categoryId: 'category-1',
    createdAt: now,
    updatedAt: now,
  };
  const createDto: CreateTransactionDto = {
    title: 'Lunch',
    amount: 25,
    type: TransactionType.EXPENSE,
    categoryId: 'category-1',
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(
        (callback: (
          client: TransactionCommandClient & TransactionQueryClient,
        ) => unknown) => callback(tx),
      ),
    };
    commandRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    queryRepository = {
      findCategoryById: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
    };

    service = new TransactionsService(
      prisma as unknown as PrismaService,
      commandRepository as unknown as TransactionsCommandRepository,
      queryRepository as unknown as TransactionsQueryRepository,
    );
  });

  it('creates a transaction atomically after category ownership/type validation', async () => {
    queryRepository.findCategoryById.mockResolvedValue({
      id: 'category-1',
      type: CategoryType.EXPENSE,
    });
    commandRepository.create.mockResolvedValue(transaction);

    await expect(service.create('user-1', createDto)).resolves.toEqual(
      transaction,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(queryRepository.findCategoryById).toHaveBeenCalledWith(
      'user-1',
      'category-1',
      tx,
    );
    expect(commandRepository.create).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        title: 'Lunch',
        amount: 25,
        type: TransactionType.EXPENSE,
        note: undefined,
        categoryId: 'category-1',
      },
      tx,
    );
  });

  it('rejects create when category is missing or type mismatched', async () => {
    queryRepository.findCategoryById.mockResolvedValue({
      id: 'category-1',
      type: CategoryType.INCOME,
    });

    await expect(service.create('user-1', createDto)).rejects.toMatchObject({
      code: ErrorCodes.TRANSACTION_CATEGORY_INVALID,
    });
    expect(commandRepository.create).not.toHaveBeenCalled();
  });

  it('returns cursor pagination metadata from repository items', async () => {
    queryRepository.findMany.mockResolvedValue([
      transaction,
      { ...transaction, id: 'transaction-2' },
      { ...transaction, id: 'transaction-3' },
    ]);

    const result = await service.findAll('user-1', {
      limit: 2,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      type: TransactionType.EXPENSE,
    });

    expect(result.data).toHaveLength(2);
    expect(result.meta).toEqual({
      limit: 2,
      nextCursor: 'transaction-2',
      hasNext: true,
    });
    expect(queryRepository.findMany).toHaveBeenCalledWith({
      userId: 'user-1',
      limit: 2,
      cursor: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      type: TransactionType.EXPENSE,
      categoryId: undefined,
      from: undefined,
      to: undefined,
    });
  });

  it('updates transaction and validates next category/type in one transaction', async () => {
    queryRepository.findById.mockResolvedValue(transaction);
    queryRepository.findCategoryById.mockResolvedValue({
      id: 'category-1',
      type: CategoryType.EXPENSE,
    });
    commandRepository.update.mockResolvedValue({ ...transaction, amount: 50 });

    await expect(
      service.update('user-1', 'transaction-1', { amount: 50 }),
    ).resolves.toMatchObject({ amount: 50 });

    expect(commandRepository.update).toHaveBeenCalledWith(
      'transaction-1',
      {
        title: undefined,
        amount: 50,
        type: undefined,
        note: undefined,
        categoryId: undefined,
      },
      tx,
    );
  });

  it('throws when deleting a missing transaction', async () => {
    queryRepository.findById.mockResolvedValue(null);

    await expect(
      service.remove('user-1', 'missing-transaction'),
    ).rejects.toMatchObject({
      code: ErrorCodes.TRANSACTION_NOT_FOUND,
    });
    expect(commandRepository.delete).not.toHaveBeenCalled();
  });
});
