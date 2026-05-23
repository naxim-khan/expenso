import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const usersCount = await this.prisma.user.count();

    return {
      status: 'ok',
      dbConnected: true,
      usersCount,
    };
  }
}
