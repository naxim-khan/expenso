import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type RefreshTokenSchema = z.infer<typeof refreshTokenSchema>;
