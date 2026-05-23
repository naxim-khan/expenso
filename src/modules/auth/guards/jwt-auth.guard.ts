import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser | false) {
    if (err || !user) {
      throw new AppException(
        ErrorCodes.UNAUTHORIZED_ACCESS,
        'Unauthorized access',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return user;
  }
}
