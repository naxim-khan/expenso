import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  it('hashes and compares passwords', async () => {
    const hash = await service.hashPassword('password123');

    expect(hash).not.toBe('password123');
    await expect(service.comparePassword('password123', hash)).resolves.toBe(
      true,
    );
    await expect(service.comparePassword('wrong-password', hash)).resolves.toBe(
      false,
    );
  });
});
