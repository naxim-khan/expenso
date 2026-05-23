import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardMapper } from './mappers/dashboard.mapper';
import { DashboardQueryRepository } from './repositories/query.repository';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardQueryRepository, DashboardMapper],
})
export class DashboardModule {}
