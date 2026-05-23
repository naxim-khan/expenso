import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PublicUser, UserWithPassword } from './interfaces/auth.types';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type AuthUserDataClient = Pick<PrismaService, 'user'>;

@Injectable()
export class AuthUserService {
  constructor(private readonly prisma: PrismaService) {}

  findUserIdByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  createUser(
    data: {
      name: string;
      email: string;
      password: string;
    },
    client: AuthUserDataClient = this.prisma,
  ): Promise<PublicUser> {
    return client.user.create({
      data,
      select: publicUserSelect,
    });
  }

  findUserWithPasswordByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        password: true,
      },
    });
  }

  findPublicUserById(userId: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });
  }
}
