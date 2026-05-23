import { Injectable } from '@nestjs/common';
import { PublicUser } from '../interfaces/auth.types';

@Injectable()
export class AuthMapper {
  toPublicUser(user: PublicUser & { password?: string }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
