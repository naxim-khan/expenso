import { Role } from '../../../generated/prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
}
