import { Role } from '../../../generated/prisma/client';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPassword = PublicUser & {
  password: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResult = {
  user: PublicUser;
  tokens: TokenPair;
};
