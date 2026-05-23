import { loginSchema, refreshTokenSchema, registerSchema } from './auth.schema';

describe('auth shared schemas', () => {
  it('validates login payloads', () => {
    expect(
      loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      }).success,
    ).toBe(true);

    expect(
      loginSchema.safeParse({
        email: 'invalid-email',
        password: 'short',
      }).success,
    ).toBe(false);
  });

  it('validates register payloads', () => {
    expect(
      registerSchema.safeParse({
        name: 'Test User',
        email: 'user@example.com',
        password: 'password123',
      }).success,
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        name: 'T',
        email: 'user@example.com',
        password: 'password123',
      }).success,
    ).toBe(false);
  });

  it('validates refresh token payloads', () => {
    expect(
      refreshTokenSchema.safeParse({
        refreshToken: 'refresh-token',
      }).success,
    ).toBe(true);

    expect(
      refreshTokenSchema.safeParse({
        refreshToken: '',
      }).success,
    ).toBe(false);
  });
});
