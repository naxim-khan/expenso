import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCodes } from '../constants/error-codes';
import { AppException } from '../exceptions/app.exception';

type ErrorBody = {
  code: string;
  message: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.getStatus(exception);
    const error = this.getErrorBody(exception, status);

    response.status(status).json({
      success: false,
      error,
    });
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorBody(exception: unknown, status: number): ErrorBody {
    if (exception instanceof AppException) {
      return {
        code: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? (response as { message: string | string[] }).message
          : exception.message;

      return {
        code:
          status === HttpStatus.BAD_REQUEST
            ? ErrorCodes.VALIDATION_ERROR
            : exception.name,
        message,
      };
    }

    return {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
