import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCodes } from '../../common/constants/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import {
  buildCursorPagination,
  CursorPaginationResult,
} from '../../common/utils/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCategoryMatchesTransactionType } from './domain/transaction.rules';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsCommandRepository } from './repositories/command.repository';
import {
  TransactionQueryClient,
  TransactionsQueryRepository,
} from './repositories/query.repository';
import { TransactionResponse } from './repositories/transaction.select';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commandRepository: TransactionsCommandRepository,
    private readonly queryRepository: TransactionsQueryRepository,
  ) {}

  create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureCategoryMatchesType(
        userId,
        dto.categoryId,
        dto.type,
        tx,
      );

      return this.commandRepository.create(
        {
          userId,
          title: dto.title,
          amount: dto.amount,
          type: dto.type,
          note: dto.note,
          categoryId: dto.categoryId,
        },
        tx,
      );
    });
  }

  async findAll(
    userId: string,
    query: ListTransactionsDto,
  ): Promise<CursorPaginationResult<TransactionResponse>> {
    const items = await this.queryRepository.findMany({
      userId,
      limit: query.limit,
      cursor: query.cursor,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      type: query.type,
      categoryId: query.categoryId,
      from: query.from,
      to: query.to,
    });

    return buildCursorPagination(items, query.limit);
  }

  async findOne(userId: string, id: string): Promise<TransactionResponse> {
    const transaction = await this.queryRepository.findById(userId, id);

    if (!transaction) {
      throw this.notFound();
    }

    return transaction;
  }

  update(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await this.queryRepository.findById(userId, id, tx);

      if (!transaction) {
        throw this.notFound();
      }

      const nextCategoryId = dto.categoryId ?? transaction.categoryId;
      const nextType = dto.type ?? transaction.type;

      await this.ensureCategoryMatchesType(
        userId,
        nextCategoryId,
        nextType,
        tx,
      );

      return this.commandRepository.update(
        id,
        {
          title: dto.title,
          amount: dto.amount,
          type: dto.type,
          note: dto.note,
          categoryId: dto.categoryId,
        },
        tx,
      );
    });
  }

  remove(userId: string, id: string): Promise<TransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await this.queryRepository.findById(userId, id, tx);

      if (!transaction) {
        throw this.notFound();
      }

      return this.commandRepository.delete(id, tx);
    });
  }

  private async ensureCategoryMatchesType(
    userId: string,
    categoryId: string,
    transactionType: TransactionResponse['type'],
    tx: TransactionQueryClient,
  ) {
    const category = await this.queryRepository.findCategoryById(
      userId,
      categoryId,
      tx,
    );

    assertCategoryMatchesTransactionType(category, transactionType);
  }

  private notFound(): AppException {
    return new AppException(
      ErrorCodes.TRANSACTION_NOT_FOUND,
      'Transaction not found',
      HttpStatus.NOT_FOUND,
    );
  }
}
