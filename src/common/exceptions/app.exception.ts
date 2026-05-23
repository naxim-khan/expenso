import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes';

export class AppException extends HttpException {
  constructor(
    public readonly code: ErrorCodes,
    message: string,
    statusCode: HttpStatus,
  ) {
    super({ code, message }, statusCode);
  }
}
