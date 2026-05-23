import { HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';

export function assertCategoryNameIsAvailable(
  duplicate: { id: string } | null,
) {
  if (duplicate) {
    throw new AppException(
      ErrorCodes.CATEGORY_ALREADY_EXISTS,
      'Category name already exists',
      HttpStatus.CONFLICT,
    );
  }
}

export function assertCategoryCanBeDeleted(transactionCount: number) {
  if (transactionCount > 0) {
    throw new AppException(
      ErrorCodes.CATEGORY_IN_USE,
      'Category has transactions and cannot be deleted',
      HttpStatus.CONFLICT,
    );
  }
}
