require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Role } = require('../dist/generated/prisma/client');
const { PasswordService } = require('../dist/modules/auth/password.service');

const adminName = process.env.ADMIN_NAME ?? 'Super Admin';
const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@expenso.local';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the admin user.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const passwordService = new PasswordService();

async function main() {
  const hashedPassword = await passwordService.hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: Role.ADMIN,
      refreshToken: null,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
