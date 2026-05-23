import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsMapper } from './mappers/reports.mapper';
import { ReportsQueryRepository } from './repositories/query.repository';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportsQueryRepository, ReportsMapper],
})
export class ReportsModule {}
