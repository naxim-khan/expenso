import { CategoryType } from '../../../generated/prisma/client';

export const categorySelect = {
  id: true,
  name: true,
  type: true,
  isSystem: true,
  version: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type CategoryResponse = {
  id: string;
  name: string;
  type: CategoryType;
  isSystem: boolean;
  version: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
