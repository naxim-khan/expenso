import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { map, Observable } from 'rxjs';
import { RESPONSE_MESSAGE_METADATA } from '../decorators/response-message.decorator';
import { ApiResponse } from '../responses/api-response';
import { isCursorPaginationResult } from '../utils/pagination.util';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<unknown>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'Request successful';

    return next.handle().pipe(
      map((data) => {
        if (isCursorPaginationResult(data)) {
          return new ApiResponse(true, message, data.data, data.meta);
        }

        return new ApiResponse(true, message, data, {});
      }),
    );
  }
}
