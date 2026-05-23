import { HttpStatus } from '@nestjs/common';
import {
  CategoryType,
  TransactionType,
} from '../../../generated/prisma/client';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';

type CategoryForTransaction = {
  id: string;
  type: CategoryType;
} | null;

export function assertCategoryMatchesTransactionType(
  category: CategoryForTransaction,
  transactionType: TransactionType,
) {
  if (!category || category.type !== transactionType) {
    throw new AppException(
      ErrorCodes.TRANSACTION_CATEGORY_INVALID,
      'Category does not belong to user or does not match transaction type',
      HttpStatus.BAD_REQUEST,
    );
  }
}
