import { Injectable } from '@nestjs/common';
import {
  CategoryType,
  TransactionType,
} from '../../../generated/prisma/client';
import { buildPrismaCursorQuery } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { transactionSelect, TransactionResponse } from './transaction.select';

export type TransactionQueryClient = Pick<
  PrismaService,
  'category' | 'transaction'
>;

type ListTransactionsOptions = {
  userId: string;
  limit?: number;
  cursor?: string;
  sortBy: 'createdAt';
  sortOrder: 'asc' | 'desc';
  type?: TransactionType;
  categoryId?: string;
  from?: string;
  to?: string;
};

@Injectable()
export class TransactionsQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategoryById(
    userId: string,
    categoryId: string,
    client: TransactionQueryClient = this.prisma,
  ): Promise<{ id: string; type: CategoryType } | null> {
    return client.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true, type: true },
    });
  }

  findMany({
    userId,
    limit,
    cursor,
    sortBy,
    sortOrder,
    type,
    categoryId,
    from,
    to,
  }: ListTransactionsOptions): Promise<TransactionResponse[]> {
    return this.prisma.transaction.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {}),
              },
            }
          : {}),
      },
      select: transactionSelect,
      ...buildPrismaCursorQuery({ limit, cursor, sortBy, sortOrder }),
    });
  }

  findById(
    userId: string,
    id: string,
    client: TransactionQueryClient = this.prisma,
  ): Promise<TransactionResponse | null> {
    return client.transaction.findFirst({
      where: { id, userId },
      select: transactionSelect,
    });
  }
}
