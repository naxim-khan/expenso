import { Injectable } from '@nestjs/common';
import { TransactionType } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { transactionSelect, TransactionResponse } from './transaction.select';

export type TransactionCommandClient = Pick<PrismaService, 'transaction'>;

type TransactionWriteData = {
  title: string;
  amount: number;
  type: TransactionType;
  note?: string | null;
  userId: string;
  categoryId: string;
};

@Injectable()
export class TransactionsCommandRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    data: TransactionWriteData,
    client: TransactionCommandClient = this.prisma,
  ): Promise<TransactionResponse> {
    return client.transaction.create({
      data,
      select: transactionSelect,
    });
  }

  update(
    id: string,
    data: Partial<Omit<TransactionWriteData, 'userId'>>,
    client: TransactionCommandClient = this.prisma,
  ): Promise<TransactionResponse> {
    return client.transaction.update({
      where: { id },
      data,
      select: transactionSelect,
    });
  }

  delete(
    id: string,
    client: TransactionCommandClient = this.prisma,
  ): Promise<TransactionResponse> {
    return client.transaction.delete({
      where: { id },
      select: transactionSelect,
    });
  }
}
