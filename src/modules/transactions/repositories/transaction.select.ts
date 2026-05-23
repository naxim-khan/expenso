import { TransactionType } from '../../../generated/prisma/client';

export const transactionSelect = {
  id: true,
  title: true,
  amount: true,
  type: true,
  note: true,
  userId: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type TransactionResponse = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  userId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};
